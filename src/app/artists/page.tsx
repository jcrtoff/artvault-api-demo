import Link from "next/link";
import { listArtists, ArtVaultApiError, type Artist } from "@/lib/artvault";

// Artists carry 7-day presigned image URLs and change behind our back.
// No build-time prerender.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50; // matches the documented default limit

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Math.max(0, Number(offsetParam) || 0);

  let page;
  try {
    page = await listArtists({ limit: PAGE_SIZE, offset });
  } catch (err) {
    return <ErrorPanel err={err} />;
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: "#9a9aa0", textDecoration: "none" }}
        >
          ← collections
        </Link>
      </div>

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Artists</h1>
      <div style={{ fontSize: 13, color: "#9a9aa0", marginBottom: 20 }}>
        {page.total} artists
      </div>

      {page.items.length === 0 ? (
        <p>No artists found.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {page.items.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </ul>
      )}

      <Pager total={page.total} offset={page.offset} />
    </>
  );
}

function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <li
      style={{
        border: "1px solid #2a2a2e",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <Link
        href={`/artists/${artist.id}`}
        style={{ color: "#e8e8ea", textDecoration: "none" }}
      >
        <div
          style={{
            aspectRatio: "1 / 1",
            background: "#1a1a1e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {artist.primary_thumbnail_url ? (
            // Plain <img> on purpose for presigned S3 URLs (see next.config.ts).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artist.primary_thumbnail_url}
              alt={artist.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 12, color: "#6a6a70" }}>no image</span>
          )}
        </div>
        <div style={{ padding: 10 }}>
          <div style={{ fontSize: 14 }}>{artist.name}</div>
          <div style={{ fontSize: 12, color: "#9a9aa0", marginTop: 2 }}>
            {artist.artwork_count} artworks
          </div>
        </div>
      </Link>
    </li>
  );
}

function Pager({ total, offset }: { total: number; offset: number }) {
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;
  if (!hasPrev && !hasNext) return null;

  const prevOffset = Math.max(0, offset - PAGE_SIZE);
  const nextOffset = offset + PAGE_SIZE;
  const linkStyle = {
    fontSize: 13,
    color: "#e8e8ea",
    textDecoration: "none",
    border: "1px solid #2a2a2e",
    borderRadius: 8,
    padding: "6px 12px",
  } as const;

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
      {hasPrev ? (
        <Link href={`/artists?offset=${prevOffset}`} style={linkStyle}>
          ← previous
        </Link>
      ) : null}
      {hasNext ? (
        <Link href={`/artists?offset=${nextOffset}`} style={linkStyle}>
          next →
        </Link>
      ) : null}
    </div>
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
      <strong>Could not load artists.</strong>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 8 }}>
        {isApi
          ? `${err.status} ${err.code}\n${err.url}`
          : String(err instanceof Error ? err.message : err)}
      </pre>
      <p style={{ fontSize: 13, color: "#9a9aa0" }}>
        <Link href="/" style={{ color: "#9a9aa0" }}>
          ← back to collections
        </Link>
      </p>
    </div>
  );
}
