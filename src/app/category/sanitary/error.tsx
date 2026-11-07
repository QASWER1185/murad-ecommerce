'use client';
export default function Error({ reset }: { reset: () => void }) {
  return <main style={{ padding: 32 }}><h1>Catalog temporarily unavailable</h1><p>We could not load the current inventory. Please try again.</p><button onClick={reset}>Try again</button></main>;
}
