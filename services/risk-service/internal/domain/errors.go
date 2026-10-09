package domain

import "errors"

var (
	ErrRuleNotFound     = errors.New("risk rule not found")
	ErrInvalidCondition = errors.New("invalid rule condition configuration")
	ErrVelocityExceeded = errors.New("velocity limit exceeded")
)
