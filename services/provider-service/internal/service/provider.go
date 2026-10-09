package service

import (
	"context"
	"errors"
	"payment-gateway/provider-service/internal/domain"
	"payment-gateway/provider-service/internal/integration"

	"github.com/google/uuid"
)

type providerServiceImpl struct {
	repo domain.ProviderRepository
}

func NewProviderService(repo domain.ProviderRepository) domain.ProviderService {
	return &providerServiceImpl{repo: repo}
}

func (s *providerServiceImpl) CreateProvider(ctx context.Context, code, name string, capabilities []domain.ProviderCapability) (*domain.Provider, error) {
	if code == "" || name == "" {
		return nil, domain.ErrInvalidInput
	}

	// Check uniqueness
	existing, err := s.repo.GetProviderByCode(ctx, code)
	if err != nil && !errors.Is(err, domain.ErrProviderNotFound) {
		return nil, err
	}
	if existing != nil {
		return nil, domain.ErrProviderAlreadyExists
	}

	providerID := uuid.New()
	
	// Assign ID to provider and capabilities
	for i := range capabilities {
		capabilities[i].ID = uuid.New()
		capabilities[i].ProviderID = providerID
	}

	provider := &domain.Provider{
		ID:           providerID,
		Code:         code,
		Name:         name,
		Status:       domain.ProviderStatusActive,
		Capabilities: capabilities,
	}

	err = s.repo.CreateProvider(ctx, provider)
	if err != nil {
		return nil, err
	}

	return provider, nil
}

func (s *providerServiceImpl) GetProvider(ctx context.Context, id string) (*domain.Provider, error) {
	parsedID, err := uuid.Parse(id)
	if err != nil {
		return nil, domain.ErrInvalidInput
	}
	return s.repo.GetProviderByID(ctx, parsedID)
}

func (s *providerServiceImpl) ListProviders(ctx context.Context) ([]domain.Provider, error) {
	return s.repo.ListProviders(ctx)
}

func (s *providerServiceImpl) InitiatePayment(ctx context.Context, providerID string, paymentID string, amount int64, currency string, environment string) (string, error) {
	provider, err := s.GetProvider(ctx, providerID)
	if err != nil {
		return "", err
	}

	var adapter domain.ProviderAdapter
	if environment == "test" || environment == "TEST" {
		adapter = integration.NewMockProviderAdapter()
	} else {
		switch provider.Code {
		case "telebirr":
			adapter = integration.NewTelebirrAdapter("https://api.telebirr.example")
		case "cbebirr":
			adapter = integration.NewCBEBirrAdapter("https://api.cbebirr.example", "app-id", "app-key")
		case "awashpay":
			adapter = integration.NewAwashPayAdapter("https://api.awashpay.example", "client-id", "secret")
		case "mpesa":
			adapter = integration.NewMPesaAdapter("https://api.safaricom.example", "consumer-key", "consumer-secret", "pass-key")
		default:
			return "", errors.New("unsupported provider code")
		}
	}

	return adapter.InitiatePayment(ctx, paymentID, amount, currency, environment)
}

func (s *providerServiceImpl) InitiateRefund(ctx context.Context, providerID string, refundID string, amount int64, currency string, environment string) (string, error) {
	provider, err := s.GetProvider(ctx, providerID)
	if err != nil {
		return "", err
	}

	var adapter domain.ProviderAdapter
	if environment == "test" || environment == "TEST" {
		adapter = integration.NewMockProviderAdapter()
	} else {
		switch provider.Code {
		case "telebirr":
			adapter = integration.NewTelebirrAdapter("https://api.telebirr.example")
		case "cbebirr":
			adapter = integration.NewCBEBirrAdapter("https://api.cbebirr.example", "app-id", "app-key")
		case "awashpay":
			adapter = integration.NewAwashPayAdapter("https://api.awashpay.example", "client-id", "secret")
		case "mpesa":
			adapter = integration.NewMPesaAdapter("https://api.safaricom.example", "consumer-key", "consumer-secret", "pass-key")
		default:
			return "", errors.New("unsupported provider code")
		}
	}

	return adapter.InitiateRefund(ctx, refundID, amount, currency, environment)
}
