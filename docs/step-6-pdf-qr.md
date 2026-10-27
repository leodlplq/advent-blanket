# Step 6 — QR codes + printable PDF ✅ done

Deliverable of the whole backoffice: the physical hand-out.

## Scope

- Button "Générer le PDF" per participant (on detail page or `/admin` card menu — our call).
- Server route `GET /api/pdf/[slug]` (or a server action returning a file) building an **A4** PDF with:
  - header: "Calendrier de l'Avent — {Participant name}" + year
  - the **25 QR codes**, labeled like "Jour 12 — 12 décembre — Clémence" (clear mapping date ↔ QR so it can't be mixed up; scissor-friendly layout ~5×5 grid with cut marks)
  - Each QR encodes the absolute URL `/cal/{slug}/{day}` — **needs the public base URL**: `NEXT_PUBLIC_APP_URL` env var (Coolify config) with a localhost default for dev.
- Skip/gray out **days without full configuration**? Decision when building: leave empty box with "Non configuré" so she can visually see missing prep.

## Technical notes

- Deps already installed: `qrcode` (string data → PNG/SVG buffer) + `pdf-lib`.
- Generate QR as data URL on demand; PDF assembled server-side, streamed with `Content-Disposition: attachment; filename="avent-clemence-qrcodes.pdf"`.
- Route handler with `export const dynamic = "force-dynamic"` (no cache) — cacheComponents is OFF.
- Landscape vs portrait: fit 25 squares nicely — 5×5 grid fits A4 portrait better with labels under each QR.

## Acceptance criteria

- [x] PDF downloads from Coolify and localhost
- [x] Scanning a printed QR opens `APP_URL/cal/{slug}/{day}` on a phone
- [x] Labels are unambiguous (date + day number visible)

## Implementation notes (2026-10-27)

- Route: **`GET /api/pdf/[slug]`** (`src/app/api/pdf/[slug]/route.ts`), `dynamic = "force-dynamic"`, streamed with
  `Content-Disposition: attachment; filename="avent-{slug}-qrcodes.pdf"`.
- Auth: the proxy matcher only covers `/admin/*`, so the handler checks the session itself with
  `getSession()` → **401** when absent (404 on unknown participant). Never public.
- PDF builder lives in **`src/lib/qr-pdf.ts`** (pure, no Next imports): A4 portrait 5×5 grid, dashed cell borders as
  cut lines, QR PNGs from `qrcode` (`width: 256`, EC level M) embedded via `pdf-lib.embedPng`, label
  **"Jour N — N décembre"** (bold, centered) under each code, participant name + year in the sheet header,
  footer hint sentence. Standard Helvetica (WinAnsi) fonts cover the French accents.
- **Unconfigured days** get a grayed placeholder cell ("N décembre · Non configuré") — no QR printed, missing prep
  visible at a glance. A `calendar_days` row existing = configured (empty saves delete the row, see step 4).
- **Base URL priority**: `NEXT_PUBLIC_APP_URL` (env, set on Coolify) → else the **request host** (protocol from
  `new URL(request.url)`). The fallback makes dev-on-the-LAN work out of the box (QR with `http://192.168.x.x:3000/…`).
  Trailing slashes trimmed — `normalizeBaseUrl()`.
- `ADVENT_YEAR = 2026` is a single constant in `qr-pdf.ts` (no year-aware config exists yet).
- Entry points: outline button **"PDF des QR codes"** on the participant page header (with `download` attr) +
  "Imprimer les QR codes" in the `/admin` card dropdown menu.
- Verified locally: 401/404 paths, HTTP headers, 5 embedded QR images for 5 configured days; visual render checked
  (converted to PNG) — grid, labels and placeholders correct. Actual phone scan = QR encodes the constructed URL by
  construction (`${base}/cal/${slug}/${day}`), no decoder available in this environment.
