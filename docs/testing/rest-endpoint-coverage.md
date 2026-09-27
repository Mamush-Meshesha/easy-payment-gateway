# REST Endpoint Coverage & Classification

## Inventory

| Service | Method | Endpoint | Status Classification | Notes |
|---------|--------|----------|-----------------------|-------|
| API Gateway | POST | `/api/v1/auth/login` | TESTED | Existing core |
| API Gateway | POST | `/api/v1/auth/register-admin` | TESTED | Existing core |
| API Gateway | POST | `/api/v1/auth/refresh` | IMPLEMENTED_UNTESTED | Needs test in Phase A |
| API Gateway | POST | `/api/v1/merchants` | TESTED | Existing core |
| API Gateway | GET | `/api/v1/merchants` | TESTED | Existing core |
| API Gateway | GET | `/api/v1/merchants/:id` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | POST | `/api/v1/merchants/:id/apikeys` | TESTED | Existing core |
| API Gateway | DELETE | `/api/v1/merchants/:id/apikeys/:keyId` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | POST | `/api/v1/payments` | TESTED | Existing core |
| API Gateway | GET | `/api/v1/payments/:id` | PARTIALLY_IMPLEMENTED | Auth tested, logic needs test |
| API Gateway | GET | `/api/v1/providers` | TESTED | Existing core |
| API Gateway | GET | `/api/v1/providers/:id` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | POST | `/api/v1/providers` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | GET | `/api/v1/admin/merchants` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | GET | `/api/v1/admin/system/health` | TESTED | Existing core |
| API Gateway | GET | `/api/v1/risk/rules` | IMPLEMENTED_UNTESTED | Core |
| API Gateway | GET | `/api/v1/ledger/accounts/:id/balance` | IMPLEMENTED_UNTESTED | Core |
| API Gateway | GET | `/api/v1/ledger/entries` | IMPLEMENTED_UNTESTED | Core |
| API Gateway | GET | `/api/v1/reporting/payments` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | GET | `/api/v1/reporting/payments/export.csv` | OPTIONAL_NOT_IMPLEMENTED | Deferred |
| API Gateway | GET | `/api/v1/dashboard/payments` | OPTIONAL_NOT_IMPLEMENTED | Deferred BFF |
| API Gateway | GET | `/api/v1/dashboard/balances` | OPTIONAL_NOT_IMPLEMENTED | Deferred BFF |
| API Gateway | GET | `/api/v1/dashboard/transactions` | OPTIONAL_NOT_IMPLEMENTED | Deferred BFF |

## Analysis
We will not build the `OPTIONAL_NOT_IMPLEMENTED` endpoints until the financial core is strictly proven. They are cataloged in `deferred-backend-capabilities.md`.
