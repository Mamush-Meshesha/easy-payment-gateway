package models

import (
	"time"

	"github.com/google/uuid"
)

type RiskRule struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name      string    `gorm:"type:varchar(100);uniqueIndex;not null"`
	Condition string    `gorm:"type:jsonb;not null"`       // Rule engine condition payload
	Action    string    `gorm:"type:varchar(50);not null"` // e.g. BLOCK, FLAG, REQUIRE_REVIEW
	IsActive  bool      `gorm:"type:boolean;not null;default:true"`
	CreatedAt time.Time `gorm:"type:timestamptz;not null;default:now()"`
	UpdatedAt time.Time `gorm:"type:timestamptz;not null;default:now()"`
}

type RiskDecision struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	PaymentID   uuid.UUID `gorm:"type:uuid;index"`
	MerchantID  uuid.UUID `gorm:"type:uuid;index"`
	TriggeredBy uuid.UUID `gorm:"type:uuid"` // Reference to RiskRule if applicable
	ActionTaken string    `gorm:"type:varchar(50);not null"`
	Reason      string    `gorm:"type:varchar(255)"`
	CreatedAt   time.Time `gorm:"type:timestamptz;not null;default:now()"`
}
