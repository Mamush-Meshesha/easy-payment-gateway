package models

import (
	"time"

	"github.com/google/uuid"
)

type Provider struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Code      string    `gorm:"type:varchar(50);uniqueIndex;not null"`
	Name      string    `gorm:"type:varchar(255);not null"`
	Status    string    `gorm:"type:varchar(20);not null"` // e.g. ACTIVE, MAINTENANCE
	CreatedAt time.Time `gorm:"type:timestamptz;not null;default:now()"`

	Capabilities []ProviderCapability `gorm:"foreignKey:ProviderID"`
}

type ProviderCapability struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ProviderID     uuid.UUID `gorm:"type:uuid;not null;index"`
	Operation      string    `gorm:"type:varchar(50);not null"` // PAYMENT, REFUND
	Currency       string    `gorm:"type:varchar(3);not null"`
	SupportsRefund bool      `gorm:"type:boolean;not null;default:false"`
}
