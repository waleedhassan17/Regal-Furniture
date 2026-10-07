"use client"

/** Last-resort error page (the root layout itself failed), so it carries its own minimal styling. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#f5f1ea", color: "#231f20", fontFamily: "system-ui, sans-serif" }}>
        <title>Something went wrong · Regal Furnitures</title>
        <main style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <p style={{ letterSpacing: "0.14em", fontWeight: 800, fontSize: 22, margin: 0 }}>REGAL</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "24px 0 8px" }}>Something went wrong</h1>
          <p style={{ color: "#6b6259", lineHeight: 1.5, margin: 0 }}>
            The portal couldn&apos;t load. Check your connection and try again.
            {error.digest ? ` Reference: ${error.digest}` : ""}
          </p>
          <button
            onClick={() => retry()}
            style={{ marginTop: 24, height: 44, padding: "0 20px", border: 0, borderRadius: 8, background: "#c42126", color: "#fff", fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
