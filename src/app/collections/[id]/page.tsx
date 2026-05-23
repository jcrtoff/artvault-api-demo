import Link from "next/link";
import {
  listArtworks,
  listCollections,
  listCollectionArtists,
  ArtVaultApiError,
  type ArtworkSummary,
  type Collection,
  type CollectionArtist,
} from "@/lib/artvault";

// Artworks carry 7-day presigned image URLs and change behind our back.
// No build-time prerender.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50; // matches the documented default limit

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ offset?: string }>;
}) {
  const { id } = await params;
  const { offset: offsetParam } = await searchParams;
  const offset = Math.max(0, Number(offsetParam) || 0);

  // There is no documented GET /collections/{id}, so we resolve the
  // collection's display metadata from the list endpoint by id.
  let collection: Collection | undefined;
  let page;
  let artists: CollectionArtist[] = [];
  try {
    const [collections, artworks, artistPage] = await Promise.all([
      listCollections(),
      listArtworks(id, { limit: PAGE_SIZE, offset }),
      listCollectionArtists(id, { limit: PAGE_SIZE }),
    ]);
    collection = collections.find((c) => c.id === id);
    page = artworks;
    artists = artistPage.items;
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

      <h1 style={{ fontSize: 22, marginBottom: 4 }}>
        {collection?.name ?? "Collection"}
      </h1>
      <div style={{ fontSize: 13, color: "#9a9aa0", marginBottom: 20 }}>
        {collection
          ? `stem ${collection.inventory_stem} · `
          : null}
        {page.total} artworks
      </div>

      {artists.length > 0 ? <ArtistsStrip artists={artists} /> : null}

      {page.items.length === 0 ? (
        <p>No artworks in this collection.</p>
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
            <ArtworkCard key={a.id} collectionId={id} artwork={a} />
          ))}
        </ul>
      )}

      <Pager total={page.total} offset={page.offset} collectionId={id} />
    </>
  );
}

function ArtistsStrip({ artists }: { artists: CollectionArtist[] }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 14, color: "#9a9aa0", marginBottom: 10 }}>
        Artists in this collection
      </h2>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {artists.map((artist) => (
          <li key={artist.id}>
            <Link
              href={`/artists/${artist.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #2a2a2e",
                borderRadius: 999,
                padding: "4px 12px 4px 4px",
                color: "#e8e8ea",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "#1a1a1e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
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
                ) : null}
              </span>
              <span style={{ fontSize: 13 }}>{artist.name}</span>
              <span style={{ fontSize: 12, color: "#9a9aa0" }}>
                {artist.artwork_count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArtworkCard({
  collectionId,
  artwork,
}: {
  collectionId: string;
  artwork: ArtworkSummary;
}) {
  return (
    <li
      style={{
        border: "1px solid #2a2a2e",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <Link
        href={`/collections/${collectionId}/${artwork.id}`}
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
          {artwork.thumbnail_url ? (
            // Plain <img> on purpose for presigned S3 URLs (see next.config.ts).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.thumbnail_url}
              alt={artwork.inventory_id}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: 12, color: "#6a6a70" }}>no image</span>
          )}
        </div>
        <div style={{ padding: 10, fontSize: 13 }}>{artwork.inventory_id}</div>
      </Link>
    </li>
  );
}

function Pager({
  total,
  offset,
  collectionId,
}: {
  total: number;
  offset: number;
  collectionId: string;
}) {
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
        <Link
          href={`/collections/${collectionId}?offset=${prevOffset}`}
          style={linkStyle}
        >
          ← previous
        </Link>
      ) : null}
      {hasNext ? (
        <Link
          href={`/collections/${collectionId}?offset=${nextOffset}`}
          style={linkStyle}
        >
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
      <strong>Could not load this collection.</strong>
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
