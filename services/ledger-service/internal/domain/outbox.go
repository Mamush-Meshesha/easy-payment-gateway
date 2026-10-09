package domain

import (
	"time"

	"github.com/google/uuid"
)

type OutboxStatus string

const (
	OutboxStatusPending   OutboxStatus = "PENDING"
	OutboxStatusPublished OutboxStatus = "PUBLISHED"
	OutboxStatusFailed    OutboxStatus = "FAILED"
)

type OutboxEvent struct {
	EventID       uuid.UUID    `json:"eventId" gorm:"type:uuid;primaryKey"`
	EventType     string       `json:"eventType" gorm:"type:varchar(100);not null"`
	AggregateType string       `json:"aggregateType" gorm:"type:varchar(100);not null"`
	AggregateID   string       `json:"aggregateId" gorm:"type:varchar(255);not null"`
	Payload       []byte       `json:"payload" gorm:"type:jsonb;not null"`
	Status        OutboxStatus `json:"status" gorm:"type:varchar(20);not null;default:'PENDING'"`
	CreatedAt     time.Time    `json:"createdAt" gorm:"autoCreateTime"`
	PublishedAt   *time.Time   `json:"publishedAt"`
}
