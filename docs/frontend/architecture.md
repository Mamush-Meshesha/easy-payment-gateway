# Frontend Architecture

## Stack Overview
- **Core Framework**: React (v18+) with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit (RTK) for global/session state, RTK Query for server state.
- **Routing**: React Router (v6+)
- **Styling**: Vanilla CSS (following semantic design tokens).

## Core Principles
1. **Financial Source of Truth**: The backend strictly remains the source of truth. The frontend does not calculate balances or authoritative states.
2. **No Mock-Data Fallbacks**: If the backend API fails or is unreachable, the frontend explicitly shows error boundaries or states instead of falling back to fake/cached mock data.
3. **Secure Authentication**: JWT-based session state. The frontend handles 401s via interceptors and securely routes users to login on session expiration. Secrets are strictly forbidden from appearing in Redux or localStorage.
4. **Separation of Concerns**: Generic UI components (e.g., standard buttons, inputs) are domain-agnostic and live in `components/`. Domain-specific logic lives in `features/`.

## Folder Structure
```text
src/
├── app/          # App root, router definition, global Redux store setup
├── assets/       # Static assets (images, fonts, global icons)
├── components/   # Reusable generic UI components (buttons, layouts, tables)
├── features/     # Domain-specific components & logic (payments, admin, merchant)
├── layouts/      # High-level route layouts (AdminLayout, MerchantLayout)
├── pages/        # Route entry points (page wrappers tying features together)
├── services/     # API layer (RTK Query definitions, auth interceptors)
├── store/        # Redux slices (auth, ui) and store configuration
├── hooks/        # Shared custom React hooks
├── lib/          # External library configurations
├── types/        # Global TypeScript interfaces and API DTOs
├── utils/        # Helper functions (formatting, date utilities)
└── config/       # Environment variables and application config constants
```

## Routing Strategy
Protected routes are implemented via high-level layout wrappers (`<MerchantLayout />`, `<AdminLayout />`). Unauthorized access redirects to login or a 403 Forbidden page.

## Data Fetching
- **RTK Query** is used exclusively for fetching data from the BFF/REST endpoints.
- Optimistic updates are strictly limited to non-financial UX interactions.
- Paginating large datasets uses cursor/offset parameters matching backend specifications, never loading entire databases client-side.
