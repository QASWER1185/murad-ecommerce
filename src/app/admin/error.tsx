"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="admin-error">
      <h1>Workspace temporarily unavailable</h1>
      <p>
        We couldn’t load the secure catalog. Check the isolated environment
        configuration and try again.
      </p>
      <button className="admin-button" onClick={reset}>
        Try again
      </button>
      <a href="/admin/login">Return to sign in</a>
    </main>
  );
}
