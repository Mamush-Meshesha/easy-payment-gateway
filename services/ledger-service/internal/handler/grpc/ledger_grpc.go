package grpc

import (
	"context"
	"log"
	grpcauth "payment-gateway/go-grpc-auth"
	"payment-gateway/ledger-service/internal/domain"
	pb "payment-gateway/ledger-service/proto"

	"github.com/google/uuid"
)

type LedgerGrpcServer struct {
	pb.UnimplementedLedgerServiceServer
	service domain.LedgerService
}

func NewLedgerGrpcServer(service domain.LedgerService) *LedgerGrpcServer {
	return &LedgerGrpcServer{service: service}
}

func (s *LedgerGrpcServer) RecordJournalEntry(ctx context.Context, req *pb.RecordJournalEntryRequest) (*pb.RecordJournalEntryResponse, error) {
	lines := make([]domain.RecordLineRequest, len(req.Lines))
	for i, l := range req.Lines {
		accountID, err := uuid.Parse(l.AccountId)
		if err != nil {
			return &pb.RecordJournalEntryResponse{
				Success: false,
				Error:   "invalid account UUID: " + l.AccountId,
			}, nil
		}
		lines[i] = domain.RecordLineRequest{
			AccountID: accountID,
			Direction: domain.JournalDirection(l.Direction),
			Amount:    l.Amount,
		}
	}

	var pID, pTxID *string
	if req.ProviderId != "" {
		pID = &req.ProviderId
	}
	if req.ProviderTransactionId != "" {
		pTxID = &req.ProviderTransactionId
	}

	svcReq := &domain.RecordEntryRequest{
		ReferenceType:         req.ReferenceType,
		ReferenceID:           req.ReferenceId,
		ProviderID:            pID,
		ProviderTransactionID: pTxID,
		Currency:              req.Currency,
		Environment:           req.Environment,
		Lines:                 lines,
	}

	entry, err := s.service.RecordTransaction(ctx, svcReq)
	if err != nil {
		log.Printf("Ledger RecordTransaction failed: %v", err)
		return &pb.RecordJournalEntryResponse{
			Success: false,
			Error:   err.Error(),
		}, nil
	}

	return &pb.RecordJournalEntryResponse{
		Success:        true,
		Error:          "",
		JournalEntryId: entry.ID.String(),
	}, nil
}

func (s *LedgerGrpcServer) GetLedgerEntriesByReferences(ctx context.Context, req *pb.GetLedgerEntriesRequest) (*pb.GetLedgerEntriesResponse, error) {
	entries, err := s.service.GetJournalEntriesByProviderReferences(ctx, req.ProviderId, req.ProviderTransactionIds)
	if err != nil {
		return nil, err
	}

	var pbEntries []*pb.LedgerEntry
	for _, entry := range entries {
		var amount int64
		for _, line := range entry.Lines {
			if line.Direction == domain.DirectionDebit {
				amount += line.Amount
			}
		}

		pid := ""
		if entry.ProviderID != nil {
			pid = entry.ProviderID.String()
		}
		ptx := ""
		if entry.ProviderTransactionID != nil {
			ptx = *entry.ProviderTransactionID
		}

		pbEntries = append(pbEntries, &pb.LedgerEntry{
			JournalEntryId:        entry.ID.String(),
			ReferenceType:         entry.ReferenceType,
			ReferenceId:           entry.ReferenceID,
			ProviderId:            pid,
			ProviderTransactionId: ptx,
			Amount:                amount,
			Currency:              entry.Currency,
			EffectiveAt:           entry.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return &pb.GetLedgerEntriesResponse{
		Entries: pbEntries,
	}, nil
}

func (s *LedgerGrpcServer) ReserveFunds(ctx context.Context, req *pb.ReserveFundsRequest) (*pb.ReserveFundsResponse, error) {
	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, err
		}
		merchantID = parsed
	}

	if err := s.service.ReserveFunds(ctx, merchantID, req.Environment, req.Currency, req.Amount, req.ReferenceId); err != nil {
		return nil, err
	}

	return &pb.ReserveFundsResponse{Status: "SUCCESS"}, nil
}

func (s *LedgerGrpcServer) ReleaseReservedFunds(ctx context.Context, req *pb.ReleaseReservedFundsRequest) (*pb.ReleaseReservedFundsResponse, error) {
	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, err
		}
		merchantID = parsed
	}

	if err := s.service.ReleaseReservedFunds(ctx, merchantID, req.Environment, req.Currency, req.Amount, req.OriginalReferenceId); err != nil {
		return nil, err
	}

	return &pb.ReleaseReservedFundsResponse{Status: "SUCCESS"}, nil
}

func (s *LedgerGrpcServer) CompleteSettlement(ctx context.Context, req *pb.CompleteSettlementRequest) (*pb.CompleteSettlementResponse, error) {
	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, err
		}
		merchantID = parsed
	}

	if err := s.service.CompleteSettlement(ctx, merchantID, req.Environment, req.Currency, req.Amount, req.OriginalReferenceId); err != nil {
		return nil, err
	}

	return &pb.CompleteSettlementResponse{Status: "SUCCESS"}, nil
}

func (s *LedgerGrpcServer) GetLedgerBalances(ctx context.Context, req *pb.GetLedgerBalancesRequest) (*pb.GetLedgerBalancesResponse, error) {
	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, err
		}
		merchantID = parsed
	}

	var currency *string
	if req.Currency != "" {
		currency = &req.Currency
	}

	reqCtx, _ := grpcauth.GetRequestContext(ctx)
	env := ""
	if reqCtx != nil {
		env = reqCtx.Environment
	}

	accounts, err := s.service.GetAccountsByMerchant(ctx, merchantID, env, currency)
	if err != nil {
		return nil, err
	}

	var balances []*pb.AccountBalance
	for _, acc := range accounts {
		balances = append(balances, &pb.AccountBalance{
			AccountId:         acc.ID.String(),
			AccountType:       string(acc.Type),
			AccountGroup:      string(acc.AccountGroup),
			Currency:          acc.Currency,
			BalanceMinorUnits: acc.Balance,
		})
	}

	return &pb.GetLedgerBalancesResponse{
		Balances: balances,
	}, nil
}

func (s *LedgerGrpcServer) GetLedgerEntriesPaginated(ctx context.Context, req *pb.GetLedgerEntriesPaginatedRequest) (*pb.GetLedgerEntriesPaginatedResponse, error) {
	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, err
		}
		merchantID = parsed
	}

	limit := int(req.Limit)
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var currency *string
	if req.Currency != "" {
		currency = &req.Currency
	}

	var afterCursor *string
	if req.AfterCursor != "" {
		afterCursor = &req.AfterCursor
	}

	reqCtx, _ := grpcauth.GetRequestContext(ctx)
	env := ""
	if reqCtx != nil {
		env = reqCtx.Environment
	}

	entries, err := s.service.GetLedgerEntriesPaginated(ctx, merchantID, env, currency, limit, afterCursor)
	if err != nil {
		return nil, err
	}

	var pbEntries []*pb.LedgerEntry
	for _, entry := range entries {
		var amount int64
		for _, line := range entry.Lines {
			if line.Direction == domain.DirectionDebit {
				amount += line.Amount
			}
		}

		pid := ""
		if entry.ProviderID != nil {
			pid = entry.ProviderID.String()
		}
		ptx := ""
		if entry.ProviderTransactionID != nil {
			ptx = *entry.ProviderTransactionID
		}

		pbEntries = append(pbEntries, &pb.LedgerEntry{
			JournalEntryId:        entry.ID.String(),
			ReferenceType:         entry.ReferenceType,
			ReferenceId:           entry.ReferenceID,
			ProviderId:            pid,
			ProviderTransactionId: ptx,
			Amount:                amount,
			Currency:              entry.Currency,
			EffectiveAt:           entry.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	nextCursor := ""
	hasMore := false
	if len(entries) == limit {
		nextCursor = entries[len(entries)-1].ID.String()
		hasMore = true
	}

	return &pb.GetLedgerEntriesPaginatedResponse{
		Entries:    pbEntries,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, nil
}
