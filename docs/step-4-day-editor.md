# Step 4 — Calendar grid + day editor modal 🔜 todo

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

## Acceptance criteria

- [ ] Each of the 25 days is editable via modal, mobile & desktop friendly
- [ ] Selecting "Point d'étoile" (fixedRows=4) locks rows to 4
- [ ] Bad rows values rejected server-side
- [ ] Card counts on `/admin` update after edits
- [ ] Deleting yarn/stitch doesn't erase days (set-null FKs)
