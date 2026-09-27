# Deferred Backend Capabilities

This document catalogs features and endpoints that are explicitly deferred. They will NOT be implemented during the financial core validation phase to prevent scope creep.

| Feature / Endpoint | Reason Missing | Required for Payment Core? | Required for Frontend? | Dependencies | Priority |
|--------------------|----------------|----------------------------|------------------------|--------------|----------|
| `Dashboard BFF` | Belongs in presentation layer | NO | YES (Later) | Core APIs | Deferred |
| `Reporting API` | Analytical / Offline reads | NO | YES (Later) | Read Replicas | Deferred |
| `GET /merchants/:id` | Convenience CRUD | NO | YES (Later) | None | Deferred |
| `DELETE /merchants/:id/apikeys` | Key Rotation | NO | YES (Later) | None | Deferred |
| `Settlement RPCs` | Async Payouts | NO (For phase 1) | NO | Ledger / Bank APIs | Deferred |
| `Refunds API` | Requires separate intent | NO (For phase 1) | NO | Provider Refund API | Deferred |
| `Payment Read RPCs`| Analytical reads | NO | YES (Later) | None | Deferred |

**Conclusion:** We will not build any of these until the final backend gate explicitly approves moving forward.
