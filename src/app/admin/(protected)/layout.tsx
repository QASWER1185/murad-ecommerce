import { cookies } from 'next/headers';
import { csrfCookie } from '@/lib/admin/security';
import { InvalidationProcessor } from '@/components/admin/InvalidationProcessor';
import { adminPageSession } from "@/lib/admin/data";
import { CsrfField } from "@/components/admin/shared";
import { Navigation } from "@/components/admin/Navigation";
import { ShieldCheck, LogOut } from "lucide-react";
import { MutationForm } from "@/components/admin/MutationForm";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { actor, email } = await adminPageSession();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin">
          <span className="admin-monogram">
            M<span>M</span>
          </span>
          <span>
            M MURAD SONS<small>STORE ADMINISTRATION</small>
          </span>
        </a>
        <p className="admin-sidebar-label">WORKSPACE</p>
        <Navigation />
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>
            <ShieldCheck size={17} /> Catalog administration
          </span>
          <div className="admin-account">
            <span className="admin-avatar">
              {email.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{email}</strong>
              <small>
                {actor.role === "admin"
                  ? "Administrator"
                  : "Editor · read only"}
              </small>
            </span>
            <MutationForm action="/admin/actions/logout">
              <CsrfField />
              <button
                className="admin-icon-button"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </MutationForm>
          </div>
        </header>
        <main className="admin-content">
          {actor.role === "editor" ? (
            <div className="admin-notice">
              Editor access · You can inspect products and private previews.
              Changes and publication require an administrator.
            </div>
          ) : null}
          {children}
          {actor.role === "admin" && <InvalidationProcessor csrf={(await cookies()).get(csrfCookie)?.value || ""}/> }
        </main>
        <footer className="admin-footer">
          <span>M Murad Sons · Catalog workspace</span>
          <span>Private & unindexed</span>
        </footer>
      </div>
    </div>
  );
}
