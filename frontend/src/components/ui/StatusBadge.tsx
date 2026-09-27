import React from 'react';

type StatusVariant = 'SUCCESS' | 'PENDING' | 'FAILED' | 'UNKNOWN' | 'RETRY_WAIT' | 'DEAD_LETTER' | 'COMPLETION_PENDING' | 'ACTIVE' | 'SUSPENDED';

interface StatusBadgeProps {
  status: StatusVariant | string;
}

const getVariantStyles = (status: string) => {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
    case 'ACTIVE':
    case 'DELIVERED':
    case 'COMPLETED':
      return { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)' };
    case 'PENDING':
    case 'PROCESSING':
    case 'COMPLETION_PENDING':
      return { bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)' };
    case 'FAILED':
    case 'DEAD_LETTER':
    case 'SUSPENDED':
      return { bg: 'var(--status-danger-bg)', text: 'var(--status-danger-text)' };
    case 'UNKNOWN':
    case 'RETRY_WAIT':
      return { bg: 'var(--status-info-bg)', text: 'var(--status-info-text)' };
    default:
      return { bg: 'var(--status-neutral-bg)', text: 'var(--status-neutral-text)' };
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = getVariantStyles(status);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        backgroundColor: styles.bg,
        color: styles.text,
        letterSpacing: '0.025em',
        textTransform: 'uppercase'
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
