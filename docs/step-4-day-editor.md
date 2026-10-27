# Step 4 — Calendar grid + day editor modal ✅ done

The core backoffice feature. Depends on step 3 (participant detail page exists).

## Scope (from the brief, agreed in session)

On `/admin/participants/[slug]`:

- **Grid of 25 cells** (Dec 1 → 25). Each cell shows: day number, stitch name (or "—"), yarn color dot + name, rows count, a "configured/empty" visual state. Layout responsive: grid of small tiles desktop, list on mobile.
- Clicking a cell (or an empty one) opens the **day editor modal**:
  - shadcn `Dialog` on desktop, `Sheet` (side drawer) on mobile — pick one component with responsive variant (Sheet for all is acceptable if simpler).
  - Fields: **Point** (Select from `stitches` + inline "create new" affordance), **Pelotte** (Select from `yarns` + create new w/ color), **Rangs** (number 2–5), **Lien du tuto** (Input URL), **Notes** (Textarea, rendered as markdown on the public page).
  - **fixed_rows rule**: if the selected stitch has `fixedRows`, the rows field is **locked** to that value (disabled input + helper text like "Impose : 4 rangs"). Conversely if the stitchimposed, allow 2–5.
  - Save via server action → upsert into `calendar_days` (unique participantId+day) → `revalidatePath`.
  - French copy: "Jour 12 — Clémence", "Point", "Pelotte", "Nombre de rangs", "Lien du tuto", "Notes", "Enregistrer", "Vider le jour".

## Technical notes

- Route: `src/app/admin/participants/[slug]/page.tsx` — `await params` (Next 16), load participant by slug with 25 days left-joined (`leftJoin` calendar_days, order by day).
- Server actions in `src/app/admin/participants/actions.ts` (or a colocated `days.ts`): `saveDay(formData)`, `clearDay(participantId, day)`. Validation: rows = stitch.fixedRows if set, else clamp 2–5; day 1–25; tutoUrl must start with http(s):// if present.
- An empty day can be created implicitly: only insert a `calendar_days` row if at least one field is set; "configured" = row exists.
- Mobile-first CSS with Tailwind; keep the modal keyboard accessible (shadcn does).
- Inline "created stitch/yarn" flows can wait until step 5 (reference CRUD) — for now, seeds provide lists; it's fine if selecting from existing lists only, with a follow-up ticket.

## Accepted deviations from the brief

- The editor uses shadcn `Dialog` on all viewports (resize-friendly), not a mobile `Sheet` — the doc allowed it.
- Days are loaded with a second `select` on `calendar_days` + in-memory fill of the 25 slots instead of a `leftJoin` (equivalent result, simpler query).
- Rows are validated independently from the stitch when no fixed stitch is selected (still 2–5, optional if blank).

## What was built

- `src/app/admin/participants/days.ts` — server actions with `DayActionState { ok?, error? }`:
  - `saveDayAction` — validates `participantId`, `day` 1–25, tuto URL `http(s)://`, rows **integer 2–5**; when the selected stitch has `fixed_rows`, the persisted rows value is **forced server-side** to it (form input ignored, no way around it by crafting a request); all-empty form **deletes** the row instead of inserting a stub; upsert via `onConflictDoUpdate` on the `(participant_id, day)` unique index; `updatedAt` refreshed; `revalidatePath("/admin", "layout")` (keeps /admin card counts fresh).
  - `clearDayAction(participantId, day)` — deletes the day row; called directly from the client inside a `useTransition` (no form round-trip).
- `src/app/admin/participants/[slug]/calendar-grid.tsx` — client component:
  - Responsive grid `grid-cols-3 sm:grid-cols-4 md:grid-cols-5` of 25 tiles: "Jour N", stitch name (or "—"), yarn color dot + name, "N rangs", checkmark + solid border when configured, dashed border when empty.
  - Editor `Dialog` (title "Jour 12 — Clémence"): Point + Pelotte `Select`s (yarn items show the color dot), Rangs number input, Lien du tuto (type=url), Notes `Textarea` with "markdown léger" hint.
  - **Fixed-rows lock**: selecting a stitch with `fixedRows` disables the rows input, snaps its value, and shows "Impose : N rangs (Point d'étoile)."
  - Per-day form reset via `key={cell.day}` remount; save success → close + sonner toast; "Vider le jour" only rendered for configured days.
  - Scoped `<Toaster />` inside the grid (same pattern as ParticipantsManager).
- `src/app/admin/participants/[slug]/page.tsx` — loads the day rows (ordered by day), fills 25 cells, loads stitch/yarn options for the selects, renders `CalendarGrid` (replaces the step-3 placeholder).

## Verified

- `pnpm exec tsc --noEmit` clean, `pnpm build` green.
- Live smoke test (dev server + real session cookie): grid renders 25 tiles; every save/validate path exercised through the real actions — fixed stitch rows forced to 4 in DB (submitted "9" ignored), rows 9/1 and day 30 rejected, `javascript:` URL rejected, re-save upserts (rows 4→2 oververified), empty save creates no row, "Vider le jour" deletes it.
- FK set-null: deleting a yarn leaves the day intact with `yarn_id = NULL` (rows/notes preserved) — requires `foreign_keys = ON`, already set in `src/db/index.ts`. Note: the `sqlite3` CLI does **not** enforce FKs unless the pragma is passed per connection, which can make manual checks misleading.

- Fixed a real-world issue reported right after: browsing the dev server over the LAN IP (`http://192.168.1.188:3000`, e.g. from a phone) made every card/tile unclickable — Next 16 dev blocks cross-origin dev resources when the host isn't in `allowedDevOrigins`, so the page renders but never hydrates. Fix: `allowedDevOrigins: ["192.168.1.188"]` in `next.config.ts` (requires dev-server restart). Diagnosed with a headless Chromium run: full flow (login → participant card → day tile → dialog → save) passed over the LAN IP with zero console errors after the fix.

## Notes for later steps

- Step 5 (references CRUD) can reuse the dialog patterns; the "create new stitch/yarn inline" affordance mentioned in the brief was deliberately deferred here — selects are existing-lists only.
- `DayActionState` is pared down: no per-field errors, single inline message like steps 2–3.
- The notes field is stored raw; markdown rendering happens on the public page (step 7, `react-markdown` + `remark-gfm`).

## Acceptance criteria

- [x] Each of the 25 days is editable via modal, mobile & desktop friendly
- [x] Selecting "Point d'étoile" (fixedRows=4) locks rows to 4 (client lock + server enforcement)
- [x] Bad rows values rejected server-side
- [x] Card counts on `/admin` update after edits (revalidatePath layout scope)
- [x] Deleting yarn/stitch doesn't erase days (set-null FKs, verified live)
