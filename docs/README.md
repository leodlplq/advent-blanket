# Advent Blanket — Documentation d'implémentation

Documentation written in **English** so any session (human or AI) can pick up the context. The **application UI is in French**; code, comments and docs are English.

## What the app is

A website for the **2026 Advent crochet blanket** (inspired by the "chaos blanket" concept). For each day from **December 1 to 25**, each participant (started with **Clémence** and **Léo**) must crochet a row set (2–5 rows) using a randomly-chosen **crochet stitch** and a **yarn ball**. At the end of the month the 25 pieces are assembled into a blanket.

The app provides:

- a **backoffice** (single shared login, extensible to more users) to configure, per participant, the stitch / yarn / rows / tutorial link for each of the 25 days, plus optional notes;
- **PDF export** per participant: one A4 sheet with **25 QR codes**, each clearly labeled with its date + participant name, to be printed and hidden as daily gifts;
- a **public mobile-first page** per day (opened via the scanned QR code): stitch to do, number of rows (highlighted), yarn + color dot, tutorial link button, notes.

## Ownership & key decisions

| Topic | Decision |
|---|---|
| Framework | **Next.js 16 App Router** (single app: site + backoffice + API) |
| Database | **SQLite** (`better-sqlite3`) + **Drizzle ORM**, file in `data/`, auto-migration on boot (`migrate` runs on every `src/db/index.ts` import) |
| DB path override | `DATA_DIR` env var (Coolify volume) — DB file: `$DATA_DIR/advent-blanket.db` |
| UI | **shadcn/ui** (radix base, "nova" preset) + Tailwind v4 |
| Rendering | `cacheComponents: false` in `next.config.ts` — classic dynamic rendering (auth cookies + DB reads everywhere) |
| Routing protection | Next 16 **`proxy.ts`** (ex-middleware) — guards `/admin/*`, edge-safe via `src/lib/session.ts` (jose JWT, **no DB imports in proxy**) |
| Auth | `users` table + bcrypt + httpOnly JWT cookie (`advent_session`, 30 days). Any row in `users` can log in → multi-user ready |
| Per-day content | **Structured fields** (stitch, yarn, rows, tuto URL) + **one optional `notes` field** rendered as markdown (`react-markdown` + `remark-gfm`) |
| QR links | **Guessable URLs**: `/cal/{slug}/{day}` (user's choice — public by design) |
| Day-editor rows rule | `stitches.fixed_rows`: when set, the rows field is locked to that value in the edit form |
| Hosting | **Coolify**, self-hosted, single Node container; SQLite + uploads on a volume |
| PDF/QR (later) | `qrcode` + `pdf-lib`, server-side |
| Fonts | Outfit (body/UI), Fraunces (headings), Geist Mono (mono) — via `next/font/google` |

Original brief was in French (see repo history), summarizes: per-day she sees stitch → text/list, tutorial link (TikTok etc., must deep-link into the mobile app), yarn → fixed list of names, rows 2–5 with **some stitches having an exact imposed rows count**. Backoffice: login, one shared account for both calendars, per-participant 25-day grid editable via modal, markdown-ish content with photos/text/links, printable QR PDF. Public site: simple, readable on phone, driven by the scanned link.

## Progress

| Step | Content | Status |
|---|---|---|
| 1 | Scaffold + DB schema + seed | ✅ done |
| 2 | Authentication (login, session, proxy guard) | ✅ done |
| 3 | Backoffice shell: participants management | ✅ done |
| 4 | Calendar grid + day editor modal | 🔜 next |
| 5 | References management (stitches, yarns) | ⬜ todo |
| 6 | QR codes + printable PDF | ⬜ todo |
| 7 | Public day page `/cal/[slug]/[day]` | ⬜ todo |
| 8 | Polish + Coolify deployment | ⬜ todo |

One file per step in this folder: `step-<n>-<slug>.md`. Update the status line in the table above and the step file when starting/finishing a step.

## Dev cheat sheet

```bash
pnpm dev          # dev server (a stray old `next dev` may already hold port 3000 → EADDRINUSE)
pnpm build        # verify build
pnpm db:generate  # regenerate drizzle migrations after editing src/db/schema.ts
pnpm db:seed      # idempotent seed: admin user, Clémence & Léo, starter stitches/yarns
pnpm start        # prod server (after build)
```

- Default admin: `admin` / `avent2026` (override with `ADMIN_USERNAME` / `ADMIN_PASSWORD`, see `.env.example`). Set `SESSION_SECRET` in production.
- Reset local data: delete `data/advent-blanket.db*` then `pnpm db:seed`.
- **Next 16 gotchas** (see `src/AGENTS.md`-style note in the repo): Middleware is now `proxy.ts`; `params`/`searchParams` are Promises (`await` them); read bundled docs at `node_modules/next/dist/docs/` before writing non-obvious code.
- pnpm only runs postinstall scripts listed in `package.json` → `pnpm.onlyBuiltDependencies` includes `better-sqlite3` and `esbuild`.
- Files: DB `src/db/{index,schema,seed}.ts`, auth `src/lib/{auth,session}.ts`, UI components `src/components/ui/*`.

## Language conventions

- ✅ French: every user-facing copy (buttons, labels, errors, pages)
- ✅ English: code, identifiers, comments, commit messages, docs
