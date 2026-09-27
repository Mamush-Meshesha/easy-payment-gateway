# Sequence Diagrams

## Synchronous Success Flow

```mermaid
sequenceDiagram
    participant Merchant
    participant API Gateway
    participant Payment Service
    participant Merchant Service
    participant Risk Service
    participant Provider Service
    participant Ledger Service
    participant Kafka

    Merchant->>API Gateway: POST /payments
    API Gateway->>Payment Service: Forward
    Payment Service->>Merchant Service: gRPC ValidateApiKey
    Merchant Service-->>Payment Service: OK (merchant_id)
    
    Note over Payment Service: DB: Insert Idempotency Lock
    Note over Payment Service: DB: Insert CREATED
    
    Payment Service->>Risk Service: gRPC CheckRisk
    Risk Service-->>Payment Service: ALLOW
    Note over Payment Service: DB: Update INITIATED
    
    Payment Service->>Provider Service: gRPC InitiatePayment
    Provider Service-->>Payment Service: SUCCESS
    Note over Payment Service: DB: Update COMPLETION_PENDING
    
    Payment Service->>Ledger Service: gRPC RecordJournalEntry
    Ledger Service-->>Payment Service: COMMITTED
    Note over Payment Service: DB: Update SUCCEEDED
    
    Payment Service->>Kafka: Publish PaymentSucceeded
    Payment Service-->>Merchant: 200 OK
```

## Provider Timeout & Recovery

```mermaid
sequenceDiagram
    participant Payment Service
    participant Provider Service
    participant Transaction Service
    participant Kafka

    Payment Service->>Provider Service: gRPC InitiatePayment
    Note over Provider Service: Context Deadline Exceeded
    Provider Service-->>Payment Service: TIMEOUT
    
    Note over Payment Service: DB: Update UNKNOWN
    Payment Service->>Kafka: Publish PaymentUnknown
    
    ... Time Passes ...
    
    Transaction Service->>Provider Service: Poll Status (Background)
    Provider Service-->>Transaction Service: SUCCESS
    
    Transaction Service->>Kafka: Publish TransactionUpdated (SUCCESS)
    Payment Service<<-Kafka: Consume TransactionUpdated
    
    Note over Payment Service: DB: Update COMPLETION_PENDING
    Payment Service->>Ledger Service: gRPC RecordJournalEntry
    Ledger Service-->>Payment Service: COMMITTED
    Note over Payment Service: DB: Update SUCCEEDED
```
