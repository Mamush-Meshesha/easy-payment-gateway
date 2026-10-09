package grpcserver

import (
	"context"
	"time"

	"github.com/google/uuid"

	"payment-gateway/webhook-service/internal/domain"
	pb "payment-gateway/webhook-service/proto"
)

type WebhookReadServer struct {
	pb.UnimplementedWebhookReadServiceServer
	repo domain.WebhookRepository
}

func NewWebhookReadServer(repo domain.WebhookRepository) *WebhookReadServer {
	return &WebhookReadServer{repo: repo}
}

func (s *WebhookReadServer) GetWebhookDeliveries(ctx context.Context, req *pb.GetWebhookDeliveriesRequest) (*pb.GetWebhookDeliveriesResponse, error) {
	merchantID, err := uuid.Parse(req.MerchantId)
	if err != nil {
		return nil, err
	}

	limit := int(req.Limit)
	if limit == 0 {
		limit = 50
	}
	offset := int(req.Offset)

	deliveries, err := s.repo.GetDeliveriesByMerchantID(ctx, merchantID, limit, offset)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountDeliveriesByMerchantID(ctx, merchantID)
	if err != nil {
		return nil, err
	}

	var pbDeliveries []*pb.WebhookDelivery
	for _, d := range deliveries {
		var nextRetryAt string
		if !d.NextRetryAt.IsZero() {
			nextRetryAt = d.NextRetryAt.Format(time.RFC3339)
		}

		var lastErr string
		if d.LastError != nil {
			lastErr = *d.LastError
		}

		pbDeliveries = append(pbDeliveries, &pb.WebhookDelivery{
			Id:                 d.ID.String(),
			MerchantId:         d.MerchantID.String(),
			EventId:            d.ID.String(),
			EventType:          d.EventType,
			Status:             string(d.Status),
			AttemptCount:       int32(d.AttemptCount),
			ResponseStatusCode: 0, // In domain model, we need to extract from attempts if needed, for now 0
			ResponseBody:       "",
			CreatedAt:          d.CreatedAt.Format(time.RFC3339),
			NextRetryAt:        nextRetryAt,
			LastError:          lastErr,
			Payload:            d.Payload,
		})
	}

	return &pb.GetWebhookDeliveriesResponse{
		Deliveries: pbDeliveries,
		Total:      int32(total),
	}, nil
}

func (s *WebhookReadServer) ReplayWebhookDelivery(ctx context.Context, req *pb.ReplayWebhookDeliveryRequest) (*pb.ReplayWebhookDeliveryResponse, error) {
	merchantID, err := uuid.Parse(req.MerchantId)
	if err != nil {
		return nil, err
	}
	
	deliveryID, err := uuid.Parse(req.DeliveryId)
	if err != nil {
		return nil, err
	}

	err = s.repo.ReplayDelivery(ctx, deliveryID, merchantID)
	if err != nil {
		return &pb.ReplayWebhookDeliveryResponse{
			Success: false,
			Message: err.Error(),
		}, nil
	}

	return &pb.ReplayWebhookDeliveryResponse{
		Success: true,
		Message: "Webhook delivery queued for replay",
	}, nil
}
