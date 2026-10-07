package grpcserver

import (
	"context"
	"payment-gateway/payment-service/internal/domain"
	pb "payment-gateway/payment-service/proto"
	grpcauth "payment-gateway/go-grpc-auth"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type PaymentReadGrpcServer struct {
	pb.UnimplementedPaymentReadServiceServer
	repo domain.PaymentRepository
}

func NewPaymentReadGrpcServer(repo domain.PaymentRepository) *PaymentReadGrpcServer {
	return &PaymentReadGrpcServer{repo: repo}
}

func (s *PaymentReadGrpcServer) GetPayment(ctx context.Context, req *pb.GetPaymentRequest) (*pb.GetPaymentResponse, error) {
	if err := grpcauth.RequireMerchant(ctx, req.MerchantId); err != nil {
		return nil, status.Error(codes.PermissionDenied, "unauthorized access to merchant data")
	}

	paymentID, err := uuid.Parse(req.PaymentId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid payment id")
	}

	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid merchant id")
		}
		merchantID = parsed
	}

	reqCtx, _ := grpcauth.GetRequestContext(ctx)
	env := ""
	if reqCtx != nil {
		env = reqCtx.Environment
	}

	payment, err := s.repo.GetPaymentByID(ctx, paymentID, env)
	if err != nil {
		if err == domain.ErrPaymentNotFound {
			return nil, status.Error(codes.NotFound, "payment not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}

	if payment.MerchantID != merchantID {
		return nil, status.Error(codes.PermissionDenied, "payment does not belong to merchant")
	}

	return &pb.GetPaymentResponse{
		Payment: &pb.PaymentSummary{
			PaymentId:         payment.ID.String(),
			Status:            string(payment.Status),
			Amount:            payment.Amount,
			Currency:          payment.Currency,
			PaymentMethod:     payment.PaymentMethod,
			CreatedAt:         payment.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:         payment.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			CustomerId:        payment.CustomerID,
			MerchantReference: payment.MerchantReference,
			RefundedAmount:    payment.RefundedAmount,
		},
	}, nil
}

func (s *PaymentReadGrpcServer) GetPayments(ctx context.Context, req *pb.GetPaymentsRequest) (*pb.GetPaymentsResponse, error) {
	if err := grpcauth.RequireMerchant(ctx, req.MerchantId); err != nil {
		return nil, status.Error(codes.PermissionDenied, "unauthorized access to merchant data")
	}

	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid merchant id")
		}
		merchantID = parsed
	}

	limit := int(req.Limit)
	if limit <= 0 || limit > 100 {
		limit = 50
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

	payments, err := s.repo.GetPaymentsPaginated(ctx, merchantID, env, limit, afterCursor)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get payments")
	}

	var summaries []*pb.PaymentSummary
	for _, p := range payments {
		summaries = append(summaries, &pb.PaymentSummary{
			PaymentId:         p.ID.String(),
			Status:            string(p.Status),
			Amount:            p.Amount,
			Currency:          p.Currency,
			PaymentMethod:     p.PaymentMethod,
			CreatedAt:         p.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:         p.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			CustomerId:        p.CustomerID,
			MerchantReference: p.MerchantReference,
			RefundedAmount:    p.RefundedAmount,
		})
	}

	nextCursor := ""
	hasMore := false
	if len(payments) == limit {
		nextCursor = payments[len(payments)-1].ID.String()
		hasMore = true
	}

	return &pb.GetPaymentsResponse{
		Payments:   summaries,
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}, nil
}

func (s *PaymentReadGrpcServer) GetPaymentStatusHistory(ctx context.Context, req *pb.GetPaymentStatusHistoryRequest) (*pb.GetPaymentStatusHistoryResponse, error) {
	// Not implemented for this E2E test, just return empty
	return &pb.GetPaymentStatusHistoryResponse{}, nil
}

func (s *PaymentReadGrpcServer) GetRefunds(ctx context.Context, req *pb.GetRefundsRequest) (*pb.GetRefundsResponse, error) {
	if err := grpcauth.RequireMerchant(ctx, req.MerchantId); err != nil {
		return nil, status.Error(codes.PermissionDenied, "unauthorized access to merchant data")
	}

	var merchantID uuid.UUID
	if req.MerchantId != "" {
		parsed, err := uuid.Parse(req.MerchantId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid merchant id")
		}
		merchantID = parsed
	}

	var paymentIDPtr *uuid.UUID
	if req.PaymentId != "" {
		pid, err := uuid.Parse(req.PaymentId)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid payment id")
		}
		paymentIDPtr = &pid
	}

	limit := int(req.Limit)
	if limit == 0 {
		limit = 50
	}
	offset := int(req.Offset)

	reqCtx, _ := grpcauth.GetRequestContext(ctx)
	env := ""
	if reqCtx != nil {
		env = reqCtx.Environment
	}

	refunds, err := s.repo.GetRefundsPaginated(ctx, merchantID, env, paymentIDPtr, limit, offset)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to get refunds")
	}

	total, err := s.repo.CountRefunds(ctx, merchantID, env, paymentIDPtr)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to count refunds")
	}

	var pbRefunds []*pb.RefundSummary
	for _, r := range refunds {
		pbRefunds = append(pbRefunds, &pb.RefundSummary{
			Id:         r.ID.String(),
			PaymentId:  r.PaymentID.String(),
			MerchantId: r.MerchantID.String(),
			Amount:     r.Amount,
			Currency:   r.Currency,
			Status:     string(r.Status),
			Reason:     r.Reason,
			CreatedAt:  r.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:  r.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return &pb.GetRefundsResponse{
		Refunds: pbRefunds,
		Total:   int32(total),
	}, nil
}
