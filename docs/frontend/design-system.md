# Design System & UI/UX Standards

## Visual Identity
The platform is designed to look like a professional, enterprise-grade financial infrastructure product.
- **Vibe**: Clean, premium, technical, transparent, and trustworthy.
- **Typography**: Modern sans-serif (e.g., Inter or Roboto). Clear information hierarchy with readable data tables.
- **Colors**: Semantic tokens over hard-coded colors. Minimal gradients, no excessive decorations.

## Semantic Tokens
```css
:root {
  /* Surfaces */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --surface-default: #ffffff;
  --surface-muted: #f1f5f9;
  --surface-elevated: #ffffff;
  
  /* Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-inverse: #ffffff;
  
  /* Borders */
  --border-subtle: #f1f5f9;
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;
  
  /* Interactive / Brand */
  --brand-primary: #2563eb;
  --brand-hover: #1d4ed8;
  --brand-active: #1e40af;
  
  /* Semantic Statuses */
  --status-success-bg: #dcfce7;
  --status-success-text: #166534;
  --status-warning-bg: #fef9c3;
  --status-warning-text: #854d0e;
  --status-danger-bg: #fee2e2;
  --status-danger-text: #991b1b;
  --status-info-bg: #dbeafe;
  --status-info-text: #1e40af;
  --status-neutral-bg: #f1f5f9;
  --status-neutral-text: #475569;
}
```

## Component Guidelines

### Data Tables
- Must support responsive overflow (horizontal scrolling).
- Numeric amounts align to the right.
- Statuses use explicit semantic badges (e.g. `PENDING`, `SUCCESS`).
- Explicit loading skeletons (no blank screens or "0 items" during fetch).

### Forms & Interactions
- Primary financial actions (Refund, Settlement, Create API Key) require strong confirmation dialogs.
- Disable submit buttons and show inline spinners during mutations.
- Do not fake optimistic success for financial mutations.

### Error & Empty States
- Always show a clear, non-technical error boundary message when API fetches fail.
- When there is no data, display an illustration-less, clean empty state (e.g., "No payments found for this period.") rather than a broken layout or placeholder text.
