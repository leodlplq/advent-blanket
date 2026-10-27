# Step 8 — Polish + deployment (Coolify) 🔜 todo

## Polish backlog (pick as needed)

- Empty states & loading states (React `useTransition` pending in modals, `loading.tsx` if needed)
- Validation errors surfaced with `sonner` toasts
- A11y pass: labels, focus management in dialogs, aria on icon-only buttons
- Favicon + app icon (couette/Christmas motif), `theme-color`
- Backup story: nightly `data/advent-blanket.db` checkpoint into a volume dir (cron or Coolify "pre-start" script) — SQLite WAL checkpoint command: `PRAGMA wal_checkpoint(TRUNCATE);`
- README swap: replace create-next-app one with project readme pointing to `docs/`

## Deployment design (Coolify)

- Single container. Add production script `"start": "node .next/standalone/server.js"` or rely on `next start` after build — decide `output: "standalone"` in `next.config.ts` (recommended, smaller image).
- Dockerfile (or Nixpacks): base node:24-alpine, `pnpm i` (native better-sqlite3 needs build tools prebuilt binaries exist for common platforms), `pnpm build`, run.
- **Volumes**: mount at `/data` → set `DATA_DIR=/data` (DB lives there). Add `/data/uploads` for markdown images when uploads ship (step 4/7 determine markdown image workflow — likely URL paste only, revisit).
- Env vars: `SESSION_SECRET` (required), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `DATA_DIR=/data`, `NEXT_PUBLIC_APP_URL`.
- Migrations run automatically (see step 1) — but first boot creates `users` via seed: add **`db:seed` on Coolify start command or as a one-off** decision at deploy time.
- Domain + HTTPS handled by Coolify proxy; CompletableFuture the QR url from `NEXT_PUBLIC_APP_URL`.

## Acceptance criteria

- [ ] Deployed to Coolify instance, HTTPS, domain set
- [ ] Login + backoffice + public page work on the shared URL
- [ ] DB persists across restarts/redeploys (volume, WAL mode)
- [ ] PDF generation URL works with domain QRs
