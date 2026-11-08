import { connection } from "next/server";
import { redirect } from "next/navigation";
import { requestAdminClient } from "@/lib/admin/supabase-server";
import { catalogSessionAccess } from "@/lib/admin/assurance";
import { readAdminConfig } from "@/lib/admin/config";
import { CsrfField, Notice } from "@/components/admin/shared";
import { MutationForm } from "@/components/admin/MutationForm";
export default async function MfaPage() {
  await connection();
  if (!readAdminConfig()) redirect("/admin/login?notice=disabled");
  const client = await requestAdminClient();
  const access = await catalogSessionAccess(client).catch(() => null);
  if (!access) redirect("/admin/login?notice=access");
  if (!access.needsMfa) redirect("/admin");
  const result = await client.auth.mfa.listFactors();
  const factors = result.data?.totp.filter((factor) => factor.status === "verified") || [];
  return <main className="admin-login-panel"><section className="admin-login-card">
    <p className="admin-eyebrow">SECURE WORKSPACE</p><h1>Verify your identity</h1>
    <p>Enter the current six-digit code from your enrolled authenticator.</p>
    {!factors.length ? <Notice message="No verified authenticator is available. Contact the trusted operator for identity-checked recovery. Access remains locked." error /> :
      <MutationForm action="/admin/mfa/verify"><CsrfField />
        <label>Authenticator<select name="factor" required>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.friendly_name || "Authenticator"}</option>)}</select></label>
        <label>Verification code<input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required /></label>
        <button className="admin-button">Verify and continue</button>
      </MutationForm>}
    <MutationForm action="/admin/actions/logout"><CsrfField /><button className="admin-button secondary">Sign out</button></MutationForm>
    <p className="admin-login-help">Recovery never changes your role or bypasses MFA. There is no public enrollment or account registration.</p>
  </section></main>;
}
