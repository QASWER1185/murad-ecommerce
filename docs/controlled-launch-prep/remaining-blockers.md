# Remaining blockers and residual limits

**No real hosted security or production readiness certification.** Option 2 avoids
purchasing a third Supabase project; it does not replace provider-specific evidence.

- Critical: actual identity/dependency relationship of protected **Muraderp ai** is
  unknown. No cloud resource was inspected this phase. Shared DB/Auth/Storage,
  roles/keys/quotas/hosting dependencies prohibit an unreviewed cutover.
- Critical: actual production schema, migration history, policies/grants and
  compatible transition/backup/restore have not been authorized or inspected.
- Critical: real provider Auth/MFA/recovery/JWT revocation, Storage permissions and
  full CDN/browser withdrawal behavior need controlled acceptance before relevant
  live feature activation. Local claims must retain their precise service scope.
- Critical: current production-mode gates intentionally block Admin/media/orders/
  analytics/indexing functionality. Separate reviewed code/activation approvals
  are needed; changing environment variables alone does not make this ready.
- Hosted body/memory/duration/concurrency/connection-pool limits, workload budget,
  monitoring, key custody/rotation and scheduler have not been verified.
- Homepage/Sanitary mobile LCP and XLSX process memory remain measured local
  constraints; see performance evidence and proposed bounded worker design.
- Approved artwork/palette remain protected. Existing small-text/Deals contrast
  findings require a design decision, not an unauthorized palette edit.
- Original real product content, verified optional commercial data and business/
  customer-privacy policies remain owner-controlled prerequisites.
- Vercel owning-team 403 and Supabase member-wide free quota are historical hosted
  blockers; no retry, authorization flow or provisioning occurred this phase.
  A future visual Preview still needs its exact separate target and approval.

A local release candidate may be reviewed while these are open. Public launch or
activation of a sensitive feature is blocked by the corresponding unmet gate.
Do not label provider uncertainty an accepted improvement after launch or infer
that the owner's preference for speed overrides access/privacy requirements.
