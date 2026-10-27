# Step 7 — Public day page ✅ done

The page people find when scanning the QR code (or opening the guessable URL).

## Scope

- Route `/cal/[slug]/[day]` — `await params` (Next 16), user-chosen **non-secret** URLs.
- Content, mobile-first and **very readable** (in the dark, with nails-in-the-way hands, next to a Christmas tree):
  1. Header: "Jour {day}" + participant name + date (1–25 décembre 2026) + maybe a tiny progress cue (day n° of 25)
  2. **Point du jour** — stitch name, large
  3. **Nombre de rangs** — very large emphasized number e.g. "4 rangs" (red or accent color — this is the info you forget)
  4. **Pelotte** — yarn name with its color dot (and ideally a small swatch block of the hex)
  5. **Button "Voir le tuto"** — `tuto_url` in `<a target="_blank" rel="noopener">`; TikTok/YouTube/Instagram web URLs deep-link to the mobile apps automatically; hide the button if no URL
  6. **Notes** rendered as markdown (`react-markdown` + `remark-gfm`) — text, links, images (uploads), etc.
  7. Graceful handling of **not-configured day**: friendly French "Ce jour n'est pas encore prêt…"; **invalid day** (0, 26+, jump) or unknown slug → 404.
- SEO/metadata minimal + nice favicon later; add `description` in French.

## Technical notes

- Rendered via server component reading DB; markdown component cached fine; images in notes loaded through `<img>`/`next/image` (decide: plain markdown allows relative URLs — configure `next.config.ts` if using next/image `remotePatterns`).
- **No auth**. Keep the page absolutely lightweight (p95 target < 100ms local).
- Optional later: "Je l'ai fait ✅" local progress stored in localStorage (per day) — nice-to-have, ask the team.

## Acceptance criteria

- [x] All info readable at arm's length on a phone, dark-mode friendly
- [x] Rows count visually dominant
- [x] Tutorial button deep-links into TikTok/YouTube app on mobile
- [x] Unknown/unconfigured days handled gracefully (in French)

## Implementation notes (2026-10-27)

- Single server component `src/app/cal/[slug]/[day]/page.tsx`, `dynamic = "force-dynamic"`, `await params` (Next 16).
- DB: one query joins `calendar_days` × `stitches` × `yarns` (left join) per (participant, day); participant resolved by slug first.
- **Validation**: day path segment must be an integer 1–25 (`parseDayParam`), unknown slug or invalid day → `notFound()` (404). Participant exists but no `calendar_days` row → friendly "Ce jour n'est pas encore prêt…" page with HTTP 200 (a scanned QR should never look like an error).
- **Always dark**: the wrapper gets the `dark` class (theme variant is `&:is(.dark *)` in globals.css) → festive + readable near a Christmas tree; no theme toggle needed on the public page.
- Layout: centered max-w-md column; header = "Jour N sur 25 · N décembre 2026" + participant name (Fraunces). Sections: **Point du jour** (Fraunces text-4xl), **Nombre de rangs** (red card, text-8xl digit — the info you forget), **Pelotte** (10px color swatch + name), **Voir le tuto** full-width button (`target="_blank" rel="noopener"`, hidden when no URL — web TikTok/YouTube URLs deep-link to the apps), **Notes**.
- Rows priority: saved `rows` → stitch `fixedRows` → none ("Laisse le hasard choisir, entre 2 et 5 rangs."). Missing stitch/yarn degrade to muted placeholders (delete-safe, per step 5).
- Notes markdown: `react-markdown` + `remark-gfm` (works in RSC), styled from the container with arbitrary-variant selectors (`[&_a]:underline`, `[&_li]:ms-5`, `[&_img]:rounded-lg`…) so no prose plugin is needed; links open in a new tab like the tutorial button. Plain `<img>` allowed for later uploaded photos.
- `ADVENT_YEAR` moved to shared `src/lib/advent.ts` (also imported by the QR PDF).
- Verified: 200/404 matrix, markdown → `<h2>/<strong>/<a target=_blank rel=noopener>`, yarn hex swatch, tuto URL, date labels.
