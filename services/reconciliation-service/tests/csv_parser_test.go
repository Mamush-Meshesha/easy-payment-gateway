package tests

import (
	"context"
	"payment-gateway/reconciliation-service/internal/domain"
	"payment-gateway/reconciliation-service/internal/service"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCSVParser_ValidFile(t *testing.T) {
	csvData := `provider_transaction_id,amount,currency,status
txn-001,1000,ETB,SUCCESS
txn-002,2500,USD,FAILED
txn-003,500,ETB,PENDING
`
	parser := service.NewCSVStatementSource()
	records, err := parser.Parse(context.Background(), strings.NewReader(csvData))

	assert.NoError(t, err)
	assert.Len(t, records, 3)

	assert.Equal(t, "txn-001", records[0].ProviderTransactionID)
	assert.Equal(t, int64(1000), records[0].Amount)
	assert.Equal(t, "ETB", records[0].Currency)
	assert.Equal(t, "SUCCESS", records[0].Status)

	assert.Equal(t, "txn-002", records[1].ProviderTransactionID)
	assert.Equal(t, int64(2500), records[1].Amount)
	assert.Equal(t, "USD", records[1].Currency)
	assert.Equal(t, "FAILED", records[1].Status)
}

func TestCSVParser_MissingRequiredColumn(t *testing.T) {
	csvData := `provider_transaction_id,currency,status
txn-001,ETB,SUCCESS
`
	parser := service.NewCSVStatementSource()
	records, err := parser.Parse(context.Background(), strings.NewReader(csvData))

	assert.ErrorIs(t, err, domain.ErrInvalidCSVFormat)
	assert.Nil(t, records)
	assert.Contains(t, err.Error(), "missing required column 'amount'")
}

func TestCSVParser_InvalidAmount(t *testing.T) {
	csvData := `provider_transaction_id,amount,currency,status
txn-001,invalid_amount,ETB,SUCCESS
`
	parser := service.NewCSVStatementSource()
	records, err := parser.Parse(context.Background(), strings.NewReader(csvData))

	assert.Error(t, err)
	assert.Nil(t, records)
	assert.Contains(t, err.Error(), "invalid amount format for tx txn-001")
}

func TestCSVParser_EmptyFile(t *testing.T) {
	csvData := ``
	parser := service.NewCSVStatementSource()
	records, err := parser.Parse(context.Background(), strings.NewReader(csvData))

	assert.ErrorIs(t, err, domain.ErrInvalidCSVFormat)
	assert.Nil(t, records)
}
