package domain

import "errors"

var (
	ErrProviderNotFound      = errors.New("provider not found")
	ErrProviderAlreadyExists = errors.New("provider code already exists")
	ErrInvalidInput          = errors.New("invalid input")
)
