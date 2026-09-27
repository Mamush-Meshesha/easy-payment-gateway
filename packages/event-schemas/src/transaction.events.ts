export enum TransactionEventTypes {
  TRANSACTION_STATUS_UPDATED = 'transaction.status.updated',
}

export interface TransactionStatusUpdatedEvent {
  transactionId: string; // Internal transaction ID
  paymentId: string;
  providerTransactionId: string;
  status: 'SUCCESS' | 'FAILED'; // The finalized state
  amount: number;
  currency: string;
  timestamp: string; // ISO8601
}
