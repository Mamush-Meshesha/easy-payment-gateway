package domain

import "errors"

var (
	ErrStaleEvent = errors.New("event is older than current state")
)
