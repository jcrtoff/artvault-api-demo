# artvault-api-demo — Claude Code Instructions

## What this is

A **dogfood / reference consumer** of the public **ArtVault Client API (v1)**.
We build real website sections against the *public* API — as if we were an
external customer integrating ArtVault — to find friction before customers do.

This repo is **independent** from the main `artvault` repo (sibling dir,
separate git, separate deploy). It is never part of `artvault`'s production
pipeline.

## 🚫 The Charter — non-negotiable rules

1. **Documented endpoints only — and the docs mean PRODUCTION docs.** This app
   may use ONLY what the public contract documents. The source of truth is
   exactly what these **unauthenticated production** URLs serve — fetch them
   live (WebFetch/curl) at the start of API work, don't rely on memory:
   - Markdown: `https://api.artvault.international/api/v1/client/docs.md`
   - HTML: `https://api.artvault.international/api/v1/client/docs`
   - Discovery JSON: `https://api.artvault.international/api/v1/client`

   **Never read `../artvault/backend/app/static/CLIENT_API.md`.** A local or
   unpushed doc edit is invisible to customers, so it must be invisible to the
   demo. A finding's fix only counts once it is **deployed**; until then the
   demo correctly still sees the old contract.

   **If production docs are unreachable, STOP** — halt API work and say so. Do
   not guess shapes and do not fall back to the local artvault copy.

2. **Needing internals is a FINDING, not a workaround.** If building a feature
   requires looking at ArtVault source to learn a response shape, behaviour, or
   undocumented field — STOP. Do **not** import, infer from, or hardcode
   anything that isn't in the docs. Instead:
   - Add an entry to `FINDINGS.md` (use the template there).
   - File an `AV-xxx` ticket in Plane (workspace `rouxappraisals`, ArtVault
     project). The fix lands in the **artvault** repo (usually
     `backend/app/static/CLIENT_API.md`) and must be **deployed** before we
     re-test here — production `/docs.md` only reflects deployed changes.
   - Record the ticket number back in `FINDINGS.md` (status → filed).

   This repo *produces* findings; artvault *consumes* them. They stay decoupled
   in code, coupled through the ticket tracker.

3. **The API key is server-only.** All ArtVault calls go through Next.js server
   components / route handlers. A Bearer key must NEVER reach the browser.
   `src/lib/artvault.ts` imports `server-only` to enforce this — keep it that
   way. No `NEXT_PUBLIC_` on the key or base URL.

## Stack

Next.js (App Router) + TypeScript. Plain `<img>` for the 7-day presigned S3
image URLs on purpose (see `next.config.ts`).

- `src/lib/artvault.ts` — typed API client. Types are **transcribed from the
  docs, nothing more**. Keep undocumented shapes loose (`unknown`) rather than
  guessing — a loose type is itself a finding flag.
- `src/app/` — pages (sections we're building).

## Commands

```bash
npm install
cp .env.example .env.local   # fill ARTVAULT_API_BASE + ARTVAULT_API_KEY
npm run dev                  # http://localhost:3000
npm run typecheck            # tsc --noEmit
npm run build
```

A real `av_live_` key is minted from ArtVault **Account → API Keys** (requires
the `client_api` role). Base URL local: `http://localhost:35100/api/v1/client`.

## Git

- **Never commit without explicit instruction.** Ask first.
- Ticket prefix: `AV-xxx`.

## Checklist when adding/changing a section

1. Use only documented endpoints (charter rule 1).
2. Hit friction or an undocumented shape? → `FINDINGS.md` + `AV-xxx` (rule 2).
3. Key stays server-side (rule 3).
4. `npm run typecheck` and `npm run build` clean before considering it done.
