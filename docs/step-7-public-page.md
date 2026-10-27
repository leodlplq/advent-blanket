# Step 7 — Public day page 🔜 todo

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

- [ ] All info readable at arm's length on a phone, dark-mode friendly
- [ ] Rows count visually dominant
- [ ] Tutorial button deep-links into TikTok/YouTube app on mobile
- [ ] Unknown/unconfigured days handled gracefully (in French)
