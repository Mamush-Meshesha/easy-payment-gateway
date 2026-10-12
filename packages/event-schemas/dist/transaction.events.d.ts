export declare enum TransactionEventTypes {
    TRANSACTION_STATUS_UPDATED = "transaction.status.updated"
}
export interface TransactionStatusUpdatedEvent {
    transactionId: string;
    paymentId: string;
    providerTransactionId: string;
    status: 'SUCCESS' | 'FAILED';
    amount: number;
    currency: string;
    timestamp: string;
}
