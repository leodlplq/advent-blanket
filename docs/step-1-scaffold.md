# Step 1 — Scaffold + database + seed ✅ done

Commit: `7fcd35e` (scaffold), `d861b13` (fonts fix).

## What was done

- Next.js 16 App Router + TypeScript + Tailwind v4 scaffolded with `create-next-app` (`pnpm create next-app`), src dir, import alias `@/*`.
- shadcn/ui initialized (radix base, "nova" preset). Components installed under `src/components/ui/`: button, dialog, sheet, select, input, label, textarea, card, badge, dropdown-menu, table, separator, field, sonner.
- SQLite via `better-sqlite3` + Drizzle ORM. Allowed postinstall scripts via `pnpm.onlyBuiltDependencies` in `package.json` (`better-sqlite3`, `esbuild`) — required for better-sqlite3 native build.
- Auto-migration on boot: `migrate()` runs in `src/db/index.ts` on every import, using SQL files in `drizzle/` (generated with `pnpm db:generate`). This removes any separate migration step at deploy time.
- Kept `cacheComponents: false` in `next.config.ts` (create-next-app defaulted it to `true`).

## Schema (`src/db/schema.ts`)

- `users` — id, username (unique), passwordHash, createdAt
- `participants` — id, name, slug (unique), createdAt
- `stitches` — id, name (unique), **fixedRows** (nullable: when set, days using this stitch must use exactly that rows count — enforced at form level in step 4), createdAt
- `yarns` — id, name (unique), colorHex (default `#cccccc`), createdAt
- `calendar_days` — participantId (FK cascade), day 1–25, stitchId (FK set-null), yarnId (FK set-null), rows, tutoUrl, notes (markdown-ish), updatedAt. **unique index (participantId, day)**.

## Seed (`src/db/seed.ts`, `pnpm db:seed`)

Idempotent. Creates:
- admin account from `ADMIN_USERNAME`/`ADMIN_PASSWORD` (defaults `admin`/`avent2026`)
- participants **Clémence** (`clemence`) and **Léo** (`leo`)
- 6 stitches (2 with fixed_rows: "Point d'étoile"→4, "Point lézard"→2)
- 6 yarns named "Luna *" with distinct colors
- **No calendar days** — those are configured via the backoffice.

## Gotchas encountered

- drizzle-orm 0.45+: import path is `drizzle-orm/better-sqlite3/migrator` (not `/migrate`).
- Next 16 docs bundled at `node_modules/next/dist/docs/`; generate-agent-files block sits in `AGENTS.md` — commit it to keep the tree clean.
- Fonts: initial layout had circular CSS var (`--font-sans: var(--font-sans)`) making body text fall back to system font. Fixed by switching to Outfit (body), Fraunces (headings), Geist Mono and mapping `--font-sans: var(--font-outfit)` etc. in `globals.css`.
