import { readAdminConfig } from "@/lib/admin/config";
import { CsrfField, Notice } from "@/components/admin/shared";
import { ShieldCheck, ArrowRight, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { MutationForm } from "@/components/admin/MutationForm";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const configured = !!readAdminConfig();
  const error =
    params.notice === "access"
      ? "This account does not have workspace access. Contact the store administrator."
      : params.notice === "login"
        ? "Unable to sign in. Check your credentials and workspace access."
        : params.notice === "rate"
          ? "Too many sign-in attempts. Please wait 15 minutes and try again."
          : params.notice === "logout"
            ? "You have been signed out."
            : undefined;
  return (
    <main className="admin-login">
      <section className="admin-login-story">
        <Link href="/" className="admin-login-brand">
          M MURAD SONS<small>BUILDING MATERIAL STORE</small>
        </Link>
        <div>
          <p className="admin-eyebrow">THE STORE, BEHIND THE SCENES</p>
          <h1>
            A considered catalog.
            <br />A trusted business.
          </h1>
          <p>
            Your private workspace for product information, thoughtful
            publishing and a store built to grow.
          </p>
          <div className="admin-login-line" />
          <span>
            <ShieldCheck size={19} /> Reserved for the M Murad Sons team
          </span>
        </div>
        <p className="admin-login-address">
          Adda Plot, Al Kabir Town
          <br />
          Raiwind Road, Lahore, Pakistan
        </p>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card">
          <span className="admin-login-icon">
            <LockKeyhole size={25} />
          </span>
          <p className="admin-eyebrow">SECURE WORKSPACE</p>
          <h2>Welcome back</h2>
          <p>Sign in with your approved team account.</p>
          <Notice message={error} error={params.notice !== "logout"} />
          {!configured ? (
            <Notice message="Admin access is disabled. An authorized operator must configure the isolated admin environment before sign-in." />
          ) : null}
          <MutationForm action="/admin/actions/login">
            <CsrfField />
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
                disabled={!configured}
                placeholder="Your team email"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
                disabled={!configured}
                placeholder="Enter your password"
              />
            </label>
            <button className="admin-button" disabled={!configured}>
              Sign in securely
              <ArrowRight size={17} />
            </button>
          </MutationForm>
          <p className="admin-login-help">
            Account access is provisioned by a trusted operator. For access or
            password recovery, contact your administrator.
          </p>
          <Link className="admin-text-link" href="/">
            ← Back to the store
          </Link>
        </div>
        <span className="admin-login-footnote">
          Protected access · No public registration
        </span>
      </section>
    </main>
  );
}
