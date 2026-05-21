# Client API — Dogfood Findings

Every time the ArtVault Client API makes us wince while building this demo, it
goes here. One entry per friction point. Findings worth fixing become `AV-xxx`
tickets in Plane; the fix lands in the **artvault** repo (often in
`backend/app/static/CLIENT_API.md`), then we re-test here.

> Severity: **blocker** (can't build the feature) · **friction** (works, but
> hurt / surprised us) · **docs** (behaviour fine, docs didn't say so).

## Template

```
### F-NN — short title
- **Severity:** blocker | friction | docs
- **Where:** endpoint / doc section
- **What we tried:** …
- **What hurt / what we expected:** …
- **AV ticket:** AV-xxx (or "not filed yet")
- **Status:** open | filed | fixed | wontfix
```

---

### F-01 — `field_values` keys are undocumented and the docs example contradicts the field-groups contract
- **Severity:** docs
- **Where:** `GET /collections/{id}/artworks` (`field_values`) vs `GET .../field-groups`
- **What we tried:** Render artwork cards using `field_values` straight from the list response.
- **What hurt / what we expected:** The docs example shows `field_values: {"title": "Sunset", "creator": "Van Gogh"}`, but the field-groups section lists the base fields as `title, date_of_creation, artist_name, note, reference_id` — there is no `creator` field. A consumer can't know which keys to expect without calling `field-groups` and cross-referencing, and the one worked example uses a key (`creator`) that doesn't appear to exist. Need: either an enumerated base-field list inline, or a note that `field_values` keys are exactly the `field-groups` field ids.
- **AV ticket:** AV-223
- **Status:** filed

### F-02 — single-artwork `documents[]` shape is not specified
- **Severity:** docs
- **Where:** `GET /collections/{id}/artworks/{artworkId}`
- **What we tried:** Type the documents array to render attachment thumbnails.
- **What hurt / what we expected:** Docs say "full list of attached documents" and the Image/URL section references `documents[].url` / `documents[].thumbnail_url`, but the object's full shape (filename? mime type? group it belongs to?) is never given. Had to keep our TS type loose (`[k: string]: unknown`). Need a documented shape.
- **AV ticket:** AV-224
- **Status:** filed
