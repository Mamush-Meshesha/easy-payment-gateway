package service

import (
	"context"
	"payment-gateway/provider-service/internal/domain"
	"testing"
	"github.com/google/uuid"
)

type mockProviderRepository struct {
	providers map[string]*domain.Provider
}

func (m *mockProviderRepository) CreateProvider(ctx context.Context, provider *domain.Provider) error {
	m.providers[provider.Code] = provider
	return nil
}

func (m *mockProviderRepository) GetProviderByID(ctx context.Context, id uuid.UUID) (*domain.Provider, error) {
	return nil, domain.ErrProviderNotFound // Not needed for this test
}

func (m *mockProviderRepository) GetProviderByCode(ctx context.Context, code string) (*domain.Provider, error) {
	if p, ok := m.providers[code]; ok {
		return p, nil
	}
	return nil, domain.ErrProviderNotFound
}

func (m *mockProviderRepository) ListProviders(ctx context.Context) ([]domain.Provider, error) {
	return nil, nil
}

func TestCreateProvider_Success(t *testing.T) {
	repo := &mockProviderRepository{providers: make(map[string]*domain.Provider)}
	svc := NewProviderService(repo)

	caps := []domain.ProviderCapability{
		{Operation: "PAYMENT", Currency: "ETB", SupportsRefund: true},
	}

	provider, err := svc.CreateProvider(context.Background(), "TELEBIRR", "Telebirr Gateway", caps)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if provider.Code != "TELEBIRR" {
		t.Errorf("expected code TELEBIRR, got %s", provider.Code)
	}
	if len(provider.Capabilities) != 1 {
		t.Errorf("expected 1 capability, got %d", len(provider.Capabilities))
	}
}

func TestCreateProvider_Duplicate(t *testing.T) {
	repo := &mockProviderRepository{providers: make(map[string]*domain.Provider)}
	svc := NewProviderService(repo)

	_, _ = svc.CreateProvider(context.Background(), "TELEBIRR", "Telebirr Gateway", nil)
	_, err := svc.CreateProvider(context.Background(), "TELEBIRR", "Telebirr Gateway 2", nil)

	if err != domain.ErrProviderAlreadyExists {
		t.Fatalf("expected ErrProviderAlreadyExists, got %v", err)
	}
}
