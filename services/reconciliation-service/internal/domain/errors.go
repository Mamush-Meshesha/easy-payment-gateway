package domain

import "errors"

var (
	ErrDuplicateStatement = errors.New("a statement with this file hash has already been processed")
	ErrJobNotFound        = errors.New("reconciliation job not found")
	ErrExceptionNotFound  = errors.New("reconciliation exception not found")
	ErrInvalidCSVFormat   = errors.New("invalid CSV format")
)
