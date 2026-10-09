package models

import (
	"time"

	"github.com/google/uuid"
)

type SettlementBatch struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	MerchantID     uuid.UUID `gorm:"type:uuid;not null;index:idx_settlement_merch_date"`
	GrossAmount    int64     `gorm:"type:bigint;not null"`
	FeeAmount      int64     `gorm:"type:bigint;not null"`
	NetAmount      int64     `gorm:"type:bigint;not null"`
	Currency       string    `gorm:"type:varchar(3);not null"`
	Status         string    `gorm:"type:varchar(20);not null"`
	SettlementDate time.Time `gorm:"type:date;not null;index:idx_settlement_merch_date"`
	CreatedAt      time.Time `gorm:"type:timestamptz;not null;default:now()"`
	UpdatedAt      time.Time `gorm:"type:timestamptz;not null;default:now()"`
}
