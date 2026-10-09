package domain

import (
	"time"

	"github.com/google/uuid"
)

type DisputeStatus string

const (
	DisputeStatusNeedsResponse DisputeStatus = "NEEDS_RESPONSE"
	DisputeStatusUnderReview   DisputeStatus = "UNDER_REVIEW"
	DisputeStatusWon           DisputeStatus = "WON"
	DisputeStatusLost          DisputeStatus = "LOST"
	DisputeStatusAccepted      DisputeStatus = "ACCEPTED" // Merchant explicitly accepted it
)

type DisputeReason string

const (
	DisputeReasonFraud               DisputeReason = "FRAUD"
	DisputeReasonProductUnacceptable DisputeReason = "PRODUCT_UNACCEPTABLE"
	DisputeReasonUnrecognized        DisputeReason = "UNRECOGNIZED"
	DisputeReasonDuplicate           DisputeReason = "DUPLICATE"
)

type Dispute struct {
	ID         uuid.UUID     `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	PaymentID  uuid.UUID     `gorm:"type:uuid;not null;index" json:"paymentId"`
	MerchantID uuid.UUID     `gorm:"type:uuid;not null;index" json:"merchantId"`
	Amount     int64         `gorm:"not null" json:"amount"`
	Currency   string        `gorm:"type:varchar(3);not null" json:"currency"`
	Reason     DisputeReason `gorm:"type:varchar(50);not null" json:"reason"`
	Status     DisputeStatus `gorm:"type:varchar(50);not null" json:"status"`
	DueBy      time.Time     `gorm:"not null" json:"dueBy"` // The deadline for the merchant to submit evidence
	CreatedAt  time.Time     `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt  time.Time     `gorm:"autoUpdateTime" json:"updatedAt"`
}

type Evidence struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	DisputeID uuid.UUID `gorm:"type:uuid;not null;index" json:"disputeId"`
	FileName  string    `gorm:"type:varchar(255);not null" json:"fileName"`
	S3Key     string    `gorm:"type:varchar(255);not null" json:"s3Key"` // e.g. "disputes/{dispute_id}/{file_name}"
	MimeType  string    `gorm:"type:varchar(100);not null" json:"mimeType"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"createdAt"`

	Dispute Dispute `gorm:"foreignKey:DisputeID" json:"dispute,omitempty"`
}

type DisputeRepository interface {
	CreateDispute(dispute *Dispute) error
	GetDispute(id uuid.UUID) (*Dispute, error)
	ListDisputes(merchantID uuid.UUID, limit, offset int) ([]*Dispute, error)
	UpdateDisputeStatus(id uuid.UUID, status DisputeStatus) error
	GetDisputesByStatus(status DisputeStatus) ([]*Dispute, error)

	AddEvidence(evidence *Evidence) error
	ListEvidence(disputeID uuid.UUID) ([]*Evidence, error)
}

// LedgerClient is used to freeze funds when a dispute is opened,
// and to either release or reverse the funds depending on the outcome.
type LedgerClient interface {
	FreezeDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error
	ReleaseDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error
	ReverseDisputeFunds(merchantID uuid.UUID, paymentID uuid.UUID, amount int64, currency string) error
}
