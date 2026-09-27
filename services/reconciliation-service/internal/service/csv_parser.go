package service

import (
	"context"
	"encoding/csv"
	"fmt"
	"io"
	"payment-gateway/reconciliation-service/internal/domain"
	"strconv"
	"strings"
)

type CSVStatementSource struct{}

func NewCSVStatementSource() domain.StatementSource {
	return &CSVStatementSource{}
}

func (s *CSVStatementSource) Parse(ctx context.Context, reader io.Reader) ([]domain.ProviderRecord, error) {
	csvReader := csv.NewReader(reader)
	csvReader.TrimLeadingSpace = true
	csvReader.FieldsPerRecord = -1 // Flexible for now

	// 1. Read Header
	headers, err := csvReader.Read()
	if err != nil {
		if err == io.EOF {
			return nil, fmt.Errorf("%w: empty file", domain.ErrInvalidCSVFormat)
		}
		return nil, fmt.Errorf("%w: %v", domain.ErrInvalidCSVFormat, err)
	}

	// Dynamic column mapping (case-insensitive)
	colMap := make(map[string]int)
	for i, h := range headers {
		colMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	// Required columns
	required := []string{"provider_transaction_id", "amount", "currency", "status"}
	for _, req := range required {
		if _, ok := colMap[req]; !ok {
			return nil, fmt.Errorf("%w: missing required column '%s'", domain.ErrInvalidCSVFormat, req)
		}
	}

	// 2. Parse Records
	var records []domain.ProviderRecord

	for {
		row, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("error reading csv row: %w", err)
		}

		providerTxID := strings.TrimSpace(row[colMap["provider_transaction_id"]])
		amountStr := strings.TrimSpace(row[colMap["amount"]])
		currency := strings.ToUpper(strings.TrimSpace(row[colMap["currency"]]))
		status := strings.ToUpper(strings.TrimSpace(row[colMap["status"]]))

		if providerTxID == "" {
			continue // Skip empty rows
		}

		// Amount usually comes as decimal (e.g. 10.50). Convert to minor units.
		// For simplicity, we assume the CSV provides amounts in minor units (int64) or we parse it as float and multiply.
		// Let's assume it's in minor units for now as an integer.
		amount, err := strconv.ParseInt(amountStr, 10, 64)
		if err != nil {
			return nil, fmt.Errorf("invalid amount format for tx %s: %s", providerTxID, amountStr)
		}

		rawRow := strings.Join(row, ",")

		records = append(records, domain.ProviderRecord{
			ProviderTransactionID: providerTxID,
			Amount:                amount,
			Currency:              currency,
			Status:                status,
			RawRowData:            rawRow,
		})
	}

	return records, nil
}
