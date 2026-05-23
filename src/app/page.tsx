import Link from "next/link";
import { listCollections, ArtVaultApiError } from "@/lib/artvault";

// Always fetch live: collections depend on the API key and change behind our
// back. No build-time prerender.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let collections;
  try {
    collections = await listCollections();
  } catch (err) {
    return <ErrorPanel err={err} />;
  }

  if (collections.length === 0) {
    return <p>No collections visible to this API key.</p>;
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/artists"
          style={{ fontSize: 13, color: "#9a9aa0", textDecoration: "none" }}
        >
          Artists →
        </Link>
      </div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Your collections</h1>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
        {collections.map((c) => (
          <li
            key={c.id}
            style={{
              border: "1px solid #2a2a2e",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <Link
              href={`/collections/${c.id}`}
              style={{ color: "#e8e8ea", textDecoration: "none" }}
            >
              <div style={{ fontSize: 17, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: "#9a9aa0", marginTop: 4 }}>
                stem {c.inventory_stem} · {c.artwork_count} artworks
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function ErrorPanel({ err }: { err: unknown }) {
  const isApi = err instanceof ArtVaultApiError;
  return (
    <div
      style={{
        border: "1px solid #5a2a2a",
        background: "#1e1414",
        borderRadius: 10,
        padding: 16,
      }}
    >
      <strong>Could not load collections.</strong>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 8 }}>
        {isApi
          ? `${err.status} ${err.code}\n${err.url}`
          : String(err instanceof Error ? err.message : err)}
      </pre>
      <p style={{ fontSize: 13, color: "#9a9aa0" }}>
        Check ARTVAULT_API_BASE and ARTVAULT_API_KEY in .env.local.
      </p>
    </div>
  );
}
