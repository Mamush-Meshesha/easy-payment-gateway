package domain

import "time"

type VelocityDimension string

const (
	DimensionCustomer VelocityDimension = "customer"
	DimensionIP       VelocityDimension = "ip"
	DimensionMerchant VelocityDimension = "merchant"
	DimensionCard     VelocityDimension = "card"
)

type VelocityConfig struct {
	Dimension    VelocityDimension
	Window       time.Duration
	MaximumCount int64
}
