"use client";
import { useState } from "react";
export function MutationForm({
  action,
  children,
  className,
}: {
  action: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      action={action}
      method="post"
      className={`admin-mutation ${className || ""}`}
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        setError("");
        const data = new FormData(event.currentTarget);
        const body = new URLSearchParams();
        for (const [key, value] of data)
          if (typeof value === "string") body.append(key, value);
        setPending(true);
        try {
          const response = await fetch(action, {
            method: "POST",
            body,
            headers: { Accept: "application/json" },
          });
          const result = await response.json();
          if (!response.ok) {
            setError(
              result.error ||
                "Unable to complete this action. Please try again.",
            );
            setPending(false);
            return;
          }
          window.location.assign(result.location);
        } catch {
          setError(
            "The connection was interrupted. Check the saved product before retrying.",
          );
          setPending(false);
        }
      }}
    >
      {error ? (
        <div role="alert" className="admin-notice admin-notice-error">
          {error}
        </div>
      ) : null}
      <fieldset disabled={pending}>{children}</fieldset>
      {pending ? (
        <p role="status" className="admin-saving">
          Saving securely…
        </p>
      ) : null}
    </form>
  );
}
