# ArtVault API Demo

A reference / dogfood consumer of the **ArtVault Client API (v1)**. We build
real website sections against the *public* API — putting ourselves in the shoes
of a customer integrating ArtVault — to find friction before customers do.

## The charter (read this first)

This app may **only** use what the public contract documents — and "the docs"
means the **production** docs, fetched live (never the local artvault copy, which
may contain unpushed edits a customer can't see):

- Markdown: `https://api.artvault.international/api/v1/client/docs.md`
- HTML: `https://api.artvault.international/api/v1/client/docs`
- Discovery JSON: `https://api.artvault.international/api/v1/client`

(All unauthenticated — fetch them directly. A doc fix only counts once it's
deployed, since production `/docs.md` only reflects deployed changes.)

If building a feature requires looking at ArtVault internals to learn a response
shape or behaviour, **that is a finding**, not a workaround. Log it in
[`FINDINGS.md`](./FINDINGS.md). Findings worth fixing become `AV-xxx` tickets;
the fix lands in the **artvault** repo, then we re-test here. This repo produces
findings; artvault consumes them. The two stay decoupled in code, coupled
through the ticket tracker.

The API key is server-only. All ArtVault calls go through Next.js server
components — a Bearer key must never reach the browser. (`src/lib/artvault.ts`
imports `server-only` to enforce this.)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in ARTVAULT_API_BASE and ARTVAULT_API_KEY
npm run dev                  # http://localhost:3000
```

You need a real `av_live_` key, minted from **Account → API Keys** in ArtVault
(requires the `client_api` role). Point `ARTVAULT_API_BASE` at your local
backend (`http://localhost:35100/api/v1/client`) or production.

## What's here

- `src/lib/artvault.ts` — the typed API client. Types transcribed from the docs,
  nothing more.
- `src/app/page.tsx` — collections list.
- `src/app/collections/[id]/` — artwork gallery (next).

## Stack

Next.js (App Router) + TypeScript. Plain `<img>` for presigned S3 URLs on
purpose — see the note in `next.config.ts`.
