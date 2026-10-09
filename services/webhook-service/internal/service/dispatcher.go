package service

import (
	"bytes"
	"context"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"payment-gateway/webhook-service/internal/domain"
	"strconv"
	"time"

	"github.com/google/uuid"
)

type DispatcherService struct {
	repo       domain.WebhookRepository
	merchant   domain.MerchantClient
	httpClient *http.Client
}

func NewDispatcherService(repo domain.WebhookRepository, merchant domain.MerchantClient) *DispatcherService {
	return &DispatcherService{
		repo:     repo,
		merchant: merchant,
		httpClient: &http.Client{
			Timeout: 10 * time.Second, // Strict 10s timeout
		},
	}
}

func (s *DispatcherService) ProcessDelivery(ctx context.Context, delivery *domain.Delivery) error {
	attempt := &domain.Attempt{
		ID:            uuid.New(),
		DeliveryID:    delivery.ID,
		AttemptNumber: delivery.AttemptCount + 1,
		StartedAt:     time.Now(),
		CreatedAt:     time.Now(),
	}

	// 1. Fetch Merchant Config
	config, err := s.merchant.GetWebhookConfig(ctx, delivery.MerchantID, delivery.Environment)
	if err != nil {
		return s.failAttempt(ctx, delivery, attempt, 0, "CONFIG_ERROR", err.Error(), domain.StateRetryWait)
	}

	// 2. Prepare Payload & Signature
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	
	// Primary signature
	signatureStr := "v1=" + GenerateHMACSignature(config.PrimarySecret, timestamp, delivery.Payload)
	
	// Secondary signature (if active and not expired)
	if config.SecondarySecret != "" {
		if config.SecondaryExpiresAt == nil || config.SecondaryExpiresAt.After(time.Now()) {
			sig2 := GenerateHMACSignature(config.SecondarySecret, timestamp, delivery.Payload)
			signatureStr += ",v1=" + sig2
		}
	}

	req, err := http.NewRequestWithContext(ctx, "POST", config.URL, bytes.NewBuffer([]byte(delivery.Payload)))
	if err != nil {
		return s.failAttempt(ctx, delivery, attempt, 0, "REQUEST_BUILD_ERROR", err.Error(), domain.StateRetryWait)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-Id", delivery.ID.String())
	req.Header.Set("X-Webhook-Timestamp", timestamp)
	req.Header.Set("X-Webhook-Signature", signatureStr)

	// 3. Execute HTTP Request
	start := time.Now()
	resp, err := s.httpClient.Do(req)
	duration := time.Since(start).Milliseconds()
	attempt.ResponseTimeMs = &duration

	if err != nil {
		// Network errors / timeouts are retryable
		return s.failAttempt(ctx, delivery, attempt, 0, "NETWORK_ERROR", err.Error(), domain.StateRetryWait)
	}
	defer resp.Body.Close()

	httpStatus := resp.StatusCode
	attempt.HTTPStatus = &httpStatus

	// 4. Classify Response
	if httpStatus >= 200 && httpStatus < 300 {
		return s.succeedAttempt(ctx, delivery, attempt)
	}

	// Retryable statuses
	isRetryable := false
	switch httpStatus {
	case 408, 425, 429, 500, 502, 503, 504:
		isRetryable = true
	}

	errMsg := fmt.Sprintf("HTTP %d", httpStatus)
	if isRetryable {
		// Handle Retry-After for 429 if present
		retryAfterSeconds := 0
		if retryAfterStr := resp.Header.Get("Retry-After"); retryAfterStr != "" {
			if s, err := strconv.Atoi(retryAfterStr); err == nil {
				retryAfterSeconds = s
			}
		}
		return s.failAttemptWithRetryAfter(ctx, delivery, attempt, httpStatus, "HTTP_RETRYABLE", errMsg, retryAfterSeconds, domain.StateRetryWait)
	}

	// Non-retryable (400, 401, 403, 404, 410, 422)
	return s.failAttempt(ctx, delivery, attempt, httpStatus, "HTTP_NON_RETRYABLE", errMsg, domain.StateDeadLettered)
}

func (s *DispatcherService) succeedAttempt(ctx context.Context, delivery *domain.Delivery, attempt *domain.Attempt) error {
	now := time.Now()
	attempt.CompletedAt = &now
	delivery.Status = domain.StateDelivered
	delivery.AttemptCount = attempt.AttemptNumber
	delivery.LockedBy = nil
	delivery.LockedAt = nil
	delivery.UpdatedAt = now

	return s.repo.SaveAttempt(ctx, delivery, attempt)
}

func (s *DispatcherService) failAttempt(ctx context.Context, delivery *domain.Delivery, attempt *domain.Attempt, httpStatus int, errCode, errMsg string, desiredState domain.WebhookState) error {
	return s.failAttemptWithRetryAfter(ctx, delivery, attempt, httpStatus, errCode, errMsg, 0, desiredState)
}

func (s *DispatcherService) failAttemptWithRetryAfter(ctx context.Context, delivery *domain.Delivery, attempt *domain.Attempt, httpStatus int, errCode, errMsg string, retryAfterSeconds int, desiredState domain.WebhookState) error {
	now := time.Now()
	attempt.CompletedAt = &now
	attempt.ErrorCode = &errCode
	attempt.ErrorMessage = &errMsg
	if httpStatus != 0 {
		attempt.HTTPStatus = &httpStatus
	}

	delivery.AttemptCount = attempt.AttemptNumber
	delivery.LastError = &errMsg
	delivery.UpdatedAt = now
	delivery.LockedBy = nil
	delivery.LockedAt = nil

	if desiredState == domain.StateDeadLettered {
		delivery.Status = domain.StateDeadLettered
	} else {
		// Check max attempts
		if delivery.AttemptCount >= 10 { // Max attempts policy
			delivery.Status = domain.StateDeadLettered
		} else {
			delivery.Status = domain.StateRetryWait
			
			// Calculate Exponential Backoff + Jitter
			baseDelaySecs := 10.0
			maxDelaySecs := 3600.0 // 1 hour
			
			// 10 * 2^(attempt-1)
			calcDelay := baseDelaySecs * math.Pow(2, float64(delivery.AttemptCount-1))
			
			// Cap at max delay
			if calcDelay > maxDelaySecs {
				calcDelay = maxDelaySecs
			}
			
			// Jitter (0-20%)
			jitter := calcDelay * 0.2 * rand.Float64()
			finalDelaySecs := calcDelay + jitter
			
			// Respect Retry-After if it's longer
			if float64(retryAfterSeconds) > finalDelaySecs {
				finalDelaySecs = float64(retryAfterSeconds)
				// Cap retry after at max delay as well
				if finalDelaySecs > maxDelaySecs {
					finalDelaySecs = maxDelaySecs
				}
			}

			next := now.Add(time.Duration(finalDelaySecs) * time.Second)
			delivery.NextRetryAt = next
		}
	}

	return s.repo.SaveAttempt(ctx, delivery, attempt)
}
