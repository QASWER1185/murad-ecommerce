# Future owner approvals — all live actions NOT RUN

This phase authorizes local preparation and a Draft PR only. No earlier autonomous
staging approval carries forward into production. Approval must name exact target,
action, operator, data scope, window and recovery boundary; no secret values in chat.

| Future action | Required decision/evidence |
| --- | --- |
| Production identity/dependency discovery | Separate read-only authorization for exact e-commerce resources; identify/protect Muraderp ai and unknown shared dependencies |
| Current schema/history/access inspection | Specifically authorize production DB metadata read; no customer data unless explicitly scoped |
| Backups and restore rehearsal | Source/destination/operator/retention/encryption and isolated restore target; verify DB plus private binaries |
| Integration strategy | Accept final SHAs and dependency chain; decide whether to retire #2; authorize exact future PR merges, never auto-close |
| Production-enablement code | Review Admin production mode and hard media/order/analytics/indexing gate changes separately |
| Maintenance/cutover | E-commerce-only traffic freeze, communications, migration ledger/session guard, compatible app/schema, abort plan |
| Auth roles and recovery | Trusted operator provisioning, real TOTP enrollment/recovery and session policy; no public registration |
| Secrets/settings | Independent e-commerce keyrings/secure bindings and rotation; no shared ERP key change |
| Vercel preview | Exact separate target, owning-team authorization, protection, budget; catalog/Admin/media/orders disabled; no production DB or local tunnel |
| Catalog/media activation | Approved genuine content and real private/withdrawal acceptance before each gate opens |
| Customer order-request intake | Real gateway/rate/privacy/idempotency verification and business terms; no payment/reservation claim |
| Worker/scheduler/alerts | Machine identity, key custody, cadence, monitoring destination, budget and incident owner |
| Google indexing/analytics/Merchant | Separate property/domain/content/consent approval; no automatic sitemap submission or fake eligibility |
| Incident restore or credential revocation | Exact affected e-commerce resources and verified recovery plan; do not affect ERP |
| Any billable resource/upgrade | Actual quote and explicit cost approval |

No approval may waive a known customer-data leak, broken authorization or unknown
protected ERP dependency. Hosted behavior must be validated before the related
public feature is opened. Local success alone is insufficient.
