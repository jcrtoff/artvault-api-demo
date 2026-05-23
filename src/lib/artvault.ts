/**
 * ArtVault Client API (v1) consumer.
 *
 * DOGFOOD RULE: this file may ONLY use endpoints and shapes documented in the
 * public contract. Sources of truth, in order:
 *   1. GET /api/v1/client            (discovery JSON)
 *   2. GET /api/v1/client/docs.md    (canonical Markdown)
 *
 * If you ever need to look at the ArtVault source to figure out a response
 * shape or behaviour, STOP — that is a finding. Write it in FINDINGS.md and
 * file an AV ticket. Do not import or assume anything not in the docs.
 *
 * Server-only: imports the API key from env. Never import this from a Client
 * Component.
 */
import "server-only";

const BASE = process.env.ARTVAULT_API_BASE;
const KEY = process.env.ARTVAULT_API_KEY;

// ---- Types: transcribed from CLIENT_API.md, nothing more ------------------

export interface Collection {
  id: string;
  name: string;
  inventory_stem: string;
  artwork_count: number;
}

/** field_values is a flat dict of field_id -> value. The docs do not enumerate
 *  the keys (they vary by attached field group), so we keep it open. */
export type FieldValues = Record<string, unknown>;

export interface ArtworkSummary {
  id: string;
  inventory_id: string;
  field_group_ids: string[];
  field_values: FieldValues;
  image_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtworkPage {
  items: ArtworkSummary[];
  total: number;
  limit: number;
  offset: number;
}

/** Document shape on the single-artwork endpoint. The docs say "full list of
 *  attached documents" with url/thumbnail_url but do not give the full shape —
 *  flagged in FINDINGS.md. Kept loose until the contract is explicit. */
export interface ArtworkDocument {
  url: string;
  thumbnail_url?: string | null;
  [k: string]: unknown;
}

export interface ArtworkDetail extends ArtworkSummary {
  documents?: ArtworkDocument[];
}

/** A collection reference embedded in an Artist (GET /artists). */
export interface ArtistCollectionRef {
  id: string;
  name: string;
  artwork_count: number;
}

/** GET /artists item. `id` is a stable, backend-assigned hash of the
 *  normalized name. */
export interface Artist {
  id: string;
  name: string;
  artwork_count: number;
  primary_image_url: string | null;
  primary_thumbnail_url: string | null;
  collections: ArtistCollectionRef[];
}

export interface ArtistPage {
  items: Artist[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /collections/{id}/artists item (no embedded collections; same artist
 *  ids as GET /artists). */
export interface CollectionArtist {
  id: string;
  name: string;
  artwork_count: number;
  primary_thumbnail_url: string | null;
}

export interface CollectionArtistPage {
  items: CollectionArtist[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /artists/{id}/artworks item: an ArtworkSummary plus the collection it
 *  belongs to, for cross-collection provenance. */
export interface ArtistArtwork extends ArtworkSummary {
  collection_id: string;
  collection_name: string;
}

export interface ArtistArtworkPage {
  items: ArtistArtwork[];
  total: number;
  limit: number;
  offset: number;
}

export interface FieldDefinition {
  [k: string]: unknown;
}

export interface FieldGroup {
  id: string;
  [k: string]: unknown;
}

// ---- Error surface --------------------------------------------------------

export class ArtVaultApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public url: string,
  ) {
    super(`ArtVault API ${status} (${code}) at ${url}`);
    this.name = "ArtVaultApiError";
  }
}

function assertConfigured(): void {
  if (!BASE || !KEY) {
    throw new Error(
      "ARTVAULT_API_BASE and ARTVAULT_API_KEY must be set (see .env.example).",
    );
  }
}

async function get<T>(path: string): Promise<T> {
  assertConfigured();
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${KEY}` },
    // Presigned URLs expire in 7 days; re-fetch often. No long cache.
    cache: "no-store",
  });

  if (!res.ok) {
    // Documented errors carry a code; fall back to the raw body otherwise.
    let code = res.statusText;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body?.detail) code = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ArtVaultApiError(res.status, code, url);
  }

  return (await res.json()) as T;
}

// ---- Documented endpoints -------------------------------------------------

/** GET /collections */
export function listCollections(): Promise<Collection[]> {
  return get<Collection[]>("/collections");
}

/** GET /collections/{id}/artworks?limit=&offset= */
export function listArtworks(
  collectionId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<ArtworkPage> {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  return get<ArtworkPage>(
    `/collections/${collectionId}/artworks${qs ? `?${qs}` : ""}`,
  );
}

/** GET /collections/{id}/artworks/{artworkId} */
export function getArtwork(
  collectionId: string,
  artworkId: string,
): Promise<ArtworkDetail> {
  return get<ArtworkDetail>(
    `/collections/${collectionId}/artworks/${artworkId}`,
  );
}

/** GET /collections/{id}/field-groups */
export function listFieldGroups(collectionId: string): Promise<FieldGroup[]> {
  return get<FieldGroup[]>(`/collections/${collectionId}/field-groups`);
}

/** Build a `?limit=&offset=` suffix, omitting unset values. */
function pageQuery(opts: { limit?: number; offset?: number }): string {
  const params = new URLSearchParams();
  if (opts.limit != null) params.set("limit", String(opts.limit));
  if (opts.offset != null) params.set("offset", String(opts.offset));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** GET /artists?limit=&offset= */
export function listArtists(
  opts: { limit?: number; offset?: number } = {},
): Promise<ArtistPage> {
  return get<ArtistPage>(`/artists${pageQuery(opts)}`);
}

/** GET /artists/{artistId}/artworks?limit=&offset= */
export function listArtistArtworks(
  artistId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<ArtistArtworkPage> {
  return get<ArtistArtworkPage>(
    `/artists/${artistId}/artworks${pageQuery(opts)}`,
  );
}

/** GET /collections/{collectionId}/artists?limit=&offset= */
export function listCollectionArtists(
  collectionId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<CollectionArtistPage> {
  return get<CollectionArtistPage>(
    `/collections/${collectionId}/artists${pageQuery(opts)}`,
  );
}
