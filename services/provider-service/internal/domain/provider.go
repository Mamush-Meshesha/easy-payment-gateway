package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ProviderStatus string

const (
	ProviderStatusActive   ProviderStatus = "ACTIVE"
	ProviderStatusInactive ProviderStatus = "INACTIVE"
)

type Provider struct {
	ID           uuid.UUID            `json:"id" gorm:"type:uuid;primaryKey"`
	Code         string               `json:"code" gorm:"type:varchar(50);uniqueIndex;not null"`
	Name         string               `json:"name" gorm:"type:varchar(255);not null"`
	Status       ProviderStatus       `json:"status" gorm:"type:varchar(20);not null"`
	CreatedAt    time.Time            `json:"createdAt" gorm:"autoCreateTime"`
	Capabilities []ProviderCapability `json:"capabilities" gorm:"foreignKey:ProviderID"`
}

type ProviderCapability struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ProviderID     uuid.UUID `json:"providerId" gorm:"type:uuid;not null"`
	Operation      string    `json:"operation" gorm:"type:varchar(50);not null"` // e.g. PAYMENT, REFUND
	Currency       string    `json:"currency" gorm:"type:varchar(3);not null"`
	SupportsRefund bool      `json:"supportsRefund" gorm:"not null"`
}

// Repository Interface
type ProviderRepository interface {
	CreateProvider(ctx context.Context, provider *Provider) error
	GetProviderByID(ctx context.Context, id uuid.UUID) (*Provider, error)
	GetProviderByCode(ctx context.Context, code string) (*Provider, error)
	ListProviders(ctx context.Context) ([]Provider, error)
}

// Service Interface
type ProviderService interface {
	CreateProvider(ctx context.Context, code, name string, capabilities []ProviderCapability) (*Provider, error)
	GetProvider(ctx context.Context, id string) (*Provider, error)
	ListProviders(ctx context.Context) ([]Provider, error)
	InitiatePayment(ctx context.Context, providerID string, paymentID string, amount int64, currency string, environment string) (string, error)
	InitiateRefund(ctx context.Context, providerID string, refundID string, amount int64, currency string, environment string) (string, error)
}

// ProviderAdapter Interface for external integrations
type ProviderAdapter interface {
	InitiatePayment(ctx context.Context, paymentID string, amount int64, currency string, environment string) (string, error)
	InitiateRefund(ctx context.Context, refundID string, amount int64, currency string, environment string) (string, error)
}
