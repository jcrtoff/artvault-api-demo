import type { ReactNode } from "react";

export const metadata = {
  title: "ArtVault API Demo",
  description: "Dogfood consumer of the ArtVault Client API (v1).",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          margin: 0,
          background: "#0e0e10",
          color: "#e8e8ea",
        }}
      >
        <header
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #2a2a2e",
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          <strong style={{ fontSize: 18 }}>ArtVault API Demo</strong>
          <span style={{ fontSize: 13, color: "#9a9aa0" }}>
            built on the public Client API — dogfooding only
          </span>
        </header>
        <main style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
