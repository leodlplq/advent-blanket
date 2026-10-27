# Step 6 — QR codes + printable PDF 🔜 todo

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

- [ ] PDF downloads from Coolify and localhost
- [ ] Scanning a printed QR opens `APP_URL/cal/{slug}/{day}` on a phone
- [ ] Labels are unambiguous (date + day number visible)
