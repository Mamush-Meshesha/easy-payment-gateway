package main

import (
	"fmt"
	"log"
	"time"
	"github.com/google/uuid"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"payment-gateway/ledger-service/internal/domain"
)

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=payment_gateway port=5433 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	entry := &domain.JournalEntry{
		ID:            uuid.New(),
		ReferenceType: "TEST",
		ReferenceID:   "REF-" + uuid.New().String(),
		Environment:   "LIVE",
		Currency:      "ETB",
		Lines: []domain.JournalLine{
			{
				ID:             uuid.New(),
				AccountID:      uuid.MustParse("11111111-1111-1111-1111-111111111111"),
				Direction:      "DEBIT",
				Amount:         100,
				CreatedAt:      time.Now(),
			},
		},
	}

	if err := db.Create(entry).Error; err != nil {
		fmt.Printf("Create Error: %v\n", err)
	} else {
		fmt.Println("Success!")
	}
}
