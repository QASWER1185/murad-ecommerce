"use client";
export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <main style={{ padding: 40, color: "#002747" }}>
      <h1>Catalog temporarily unavailable</h1>
      <p>Please try again or contact M Murad Sons on WhatsApp.</p>
      <button onClick={reset}>Try again</button>
      <p>
        <a href="https://wa.me/923217165000">WhatsApp 0321-7165000</a>
      </p>
    </main>
  );
}
