# Notification Retry Policy

The Notification Service implements a strict **bounded exponential backoff with jitter** strategy for handling transient delivery failures.

## Configuration Variables
The policy is governed by environment variables allowing for environment-specific tuning (e.g., faster retries during E2E tests):

- `NOTIFICATION_MAX_RETRIES`: Maximum number of retry attempts (default: 3).
- `NOTIFICATION_RETRY_BASE_SECONDS`: Base backoff multiplier in seconds (default: 10).
- `NOTIFICATION_RETRY_MAX_SECONDS`: The maximum cap for any single backoff interval in seconds (default: 60).
- `NOTIFICATION_RETRY_JITTER_SECONDS`: Maximum jitter applied to avoid thundering herds (default: 5).

## Failure Classification
The provider adapters explicitly classify errors to prevent unnecessary retries:

### Retryable Errors
- Connection Refused (`ECONNREFUSED`)
- Connection Reset (`ECONNRESET`)
- Socket Timeout (`ETIMEDOUT`)
- DNS Failure (`ENOTFOUND`)
- Temporary Provider Issues (SMTP 4xx errors)

### Non-Retryable Errors
- Permanent Provider Rejection (SMTP 5xx errors)
- Missing required fields (e.g., missing recipient email)
- Unsupported notification channels

## Calculation Algorithm
For each attempt, the delay is calculated as:
`Delay = MIN(BASE_SECONDS * 2^(attempt - 1), MAX_SECONDS) + RANDOM(0, JITTER_SECONDS)`

This creates a progressive retry curve that spaces out traffic effectively.
