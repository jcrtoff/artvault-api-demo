import Link from "next/link";
import {
  getArtwork,
  ArtVaultApiError,
  type ArtworkDetail,
} from "@/lib/artvault";

// Presigned image/document URLs expire; always fetch live.
export const dynamic = "force-dynamic";

export default async function ArtworkPage({
  params,
}: {
  params: Promise<{ id: string; artworkId: string }>;
}) {
  const { id, artworkId } = await params;

  let artwork: ArtworkDetail;
  try {
    artwork = await getArtwork(id, artworkId);
  } catch (err) {
    return <ErrorPanel err={err} collectionId={id} />;
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link
          href={`/collections/${id}`}
          style={{ fontSize: 13, color: "#9a9aa0", textDecoration: "none" }}
        >
          ← back to collection
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 420px) 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div
          style={{
            border: "1px solid #2a2a2e",
            borderRadius: 10,
            overflow: "hidden",
            background: "#1a1a1e",
            aspectRatio: "1 / 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {artwork.image_url ? (
            // Plain <img> on purpose for presigned S3 URLs (see next.config.ts).
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.image_url}
              alt={artwork.inventory_id}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 12, color: "#6a6a70" }}>no image</span>
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>
            {artwork.inventory_id}
          </h1>
          <div style={{ fontSize: 13, color: "#9a9aa0", marginBottom: 20 }}>
            updated {artwork.updated_at}
          </div>

          <FieldValues values={artwork.field_values} />

          {artwork.documents && artwork.documents.length > 0 ? (
            <Documents documents={artwork.documents} />
          ) : null}
        </div>
      </div>
    </>
  );
}

function FieldValues({ values }: { values: Record<string, unknown> }) {
  const entries = Object.entries(values);
  if (entries.length === 0) {
    return <p style={{ fontSize: 13, color: "#9a9aa0" }}>No field values.</p>;
  }
  return (
    <dl
      style={{
        display: "grid",
        gridTemplateColumns: "max-content 1fr",
        gap: "8px 16px",
        margin: 0,
        fontSize: 14,
      }}
    >
      {entries.map(([key, value]) => (
        <div key={key} style={{ display: "contents" }}>
          <dt style={{ color: "#9a9aa0" }}>{key}</dt>
          <dd style={{ margin: 0 }}>
            {value == null ? "—" : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Documents({
  documents,
}: {
  documents: NonNullable<ArtworkDetail["documents"]>;
}) {
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 15, marginBottom: 8 }}>Documents</h2>
      <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 6 }}>
        {documents.map((doc, i) => (
          <li key={i}>
            <a
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 13, color: "#8ab4f8" }}
            >
              {doc.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorPanel({
  err,
  collectionId,
}: {
  err: unknown;
  collectionId: string;
}) {
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
      <strong>Could not load this artwork.</strong>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, marginTop: 8 }}>
        {isApi
          ? `${err.status} ${err.code}\n${err.url}`
          : String(err instanceof Error ? err.message : err)}
      </pre>
      <p style={{ fontSize: 13, color: "#9a9aa0" }}>
        <Link
          href={`/collections/${collectionId}`}
          style={{ color: "#9a9aa0" }}
        >
          ← back to collection
        </Link>
      </p>
    </div>
  );
}
