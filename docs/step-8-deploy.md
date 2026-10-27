# Step 8 — Polish + deployment (Coolify) 🚧 artifacts done, deploy pending

## Polish backlog (pick as needed)

- [x] Empty states & loading states — already done in steps 2–7 (`useTransition` pending in dialogs, empty-state tiles, friendly public "not ready" page)
- [x] Validation errors surfaced with `sonner` toasts — already done in steps 2–5
- A11y pass: partially covered (labels on fields); **not audited**
- [x] Favicon + app icon: `src/app/icon.svg` (couette motif: cream folded blanket, dashed red hem stitching on Luna Rouge `#b0413e`) + 180×180 `src/app/apple-icon.png` (rendered from the SVG with qlmanage/sips) + `viewport.themeColor: "#b0413e"` in `src/app/layout.tsx`. The create-next-app `favicon.ico` was removed — `icon.svg` covers modern browsers.
- [x] Backup story: `scripts/backup.mjs` (`pnpm db:backup` locally, `node /app/scripts/backup.mjs` in the container). WAL `PRAGMA wal_checkpoint(TRUNCATE)` then an hour-stamped copy into `${DATA_DIR}/backups` (or `BACKUP_DIR`), keeps `BACKUP_KEEP` (default 14) newest, prunes older. **Wire a nightly Coolify scheduled task running `node /app/scripts/backup.mjs` in the app container.**
- [x] README swap: project readme with dev quickstart + Coolify checklist pointing to `docs/`.

## Deployment design (Coolify) — implemented

- [x] `output: "standalone"` in `next.config.ts` → `.next/standalone/server.js`, minimal image without node_modules at runtime.
- [x] `Dockerfile`: multi-stage on `node:24-alpine` — build stage installs pnpm (`npm i -g pnpm@10`) + `python3/make/g++` (better-sqlite3 fallback compile; musl prebuilds usually exist), runs `pnpm install --frozen-lockfile && pnpm build`; runtime stage copies `.next/standalone`, `.next/static`, `public`, `drizzle` (migrations read via `process.cwd()`) and `scripts/backup.mjs`. Runs as root briefly via an entrypoint (`scripts/docker-entrypoint.sh`) that chowns `/data` then drops to the `app` user through `su-exec` — bind-mounted volumes often arrive root-owned. `ENV DATA_DIR=/data HOSTNAME=0.0.0.0 PORT=3000`.
- Gotcha found on the image test: **Turbopack bundles better-sqlite3 into the server output**, so the standalone trace has no `better-sqlite3` in `node_modules` — the server works, but the backup script couldn't resolve it. Fixed with `outputFileTracingIncludes` in `next.config.ts` (two globs: symlink + the real files under `.pnpm/`).
- [x] `.dockerignore` (node_modules, .next, data, docs, env files…).
- [x] **First-boot seeding is automatic**: `src/instrumentation.ts` runs once at production server start (`register()` — Next.js instrumentation hook, nodejs runtime only) and executes the idempotent seed (`src/db/seed.ts` now exports `runSeed()`; the old process.exit CLI moved to `scripts/seed.ts`, still `pnpm db:seed`). Migrations already run inside the first `src/db` import. So no manual seed step at deploy; the start command stays `node server.js`. Skipped in dev (guard on `NODE_ENV`).
- [x] `.env.example` for local dev; in Coolify the vars are set on the app.
- Env vars: `SESSION_SECRET` (required — needed at boot to sign sessions), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `DATA_DIR=/data`, `NEXT_PUBLIC_APP_URL` (no trailing slash; base of the QR URLs, prioritized over the request host in `/api/pdf/[slug]`).
- Domain + HTTPS handled by the Coolify proxy.

### Verified locally (2026-10-27)

- `pnpm build` + `pnpm lint` clean; icon routes (`/icon.svg`, `/apple-icon.png`) registered.
- Standalone smoke test: `DATA_DIR=<tmp> SESSION_SECRET=… node .next/standalone/server.js` → migrations + seed ran on first boot (admin + Clémence/Léo + 6 points + 6 pelottes), `/login` and `/cal/clemence/1` return 200; second boot logs "already exists" everywhere (idempotent).
- `scripts/backup.mjs`: checkpoint + copy + prune exercised (the first version had a bug — dashed timestamps didn't match the pure-digit prune regex, real backups were never pruned; fixed by dropping the dashes).
- **Full image test**: `docker build` + `docker run` with a mounted volume, env vars set → boots as `app` (uid 100), seeds, serves `/login` and `/cal/clemence/1` (200), and `node /app/scripts/backup.mjs` inside the container produces `/data/backups/advent-blanket-YYYYMMDDHHMM.db`. (Note: the local macOS test ran against a host dir mount which shows different file ownership —virtiofs quirk; irrelevant for Coolify named volumes.)

### ADMIN credential caveat

The seed creates the admin **only if it doesn't exist**. Changing `ADMIN_PASSWORD` in Coolify won't update an existing row (no password rotation path). To rotate: change `ADMIN_PASSWORD` + delete the `users` row manually (or rerun a migration) → recreated at next boot.

## Deploy checklist (on the Coolify instance) — pending

- [ ] Push this branch, create the app in Coolify (Dockerfile at repo root)
- [ ] Persistent storage mounted at `/data`
- [ ] Env vars: `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`
- [ ] Domain + HTTPS via the proxy
- [ ] Nightly scheduled task: `node /app/scripts/backup.mjs`
- [ ] Post-deploy check: login, backoffice, public page on the HTTPS URL
- [ ] Regenerate the QR PDF **after** setting `NEXT_PUBLIC_APP_URL` (URLs must be the public domain) and print the sheets
- [ ] DB survives a redeploy (volume + WAL mode)

## Acceptance criteria

- [x] Deployable: standalone image builds and boots with volume + env vars
- [ ] Deployed to Coolify instance, HTTPS, domain set
- [ ] Login + backoffice + public page work on the shared URL
- [ ] DB persists across restarts/redeploys (volume, WAL mode)
- [ ] PDF generation URL works with domain QRs
