package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
)

func GenerateHMACSignature(secret string, timestamp string, payload string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}
