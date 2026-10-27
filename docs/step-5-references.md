# Step 5 — Reference management (stitches & yarns) ✅ done

Structured CRUD for the reusable lists, needed before the day editor can offer "create on the fly".

## Scope

- `/admin/points` (stitches) and `/admin/pelottes` (yarns) pages — could also be tabs on one `/admin/references` page.
- **Stitches**: name, optional `fixed_rows` (explicitly labeled "Rangs imposés" with helper "Laisser vide pour laisser le choix entre 2 et 5 rangs") + CrUD dialogs + delete confirmation.
- **Yarns**: name + color (color swatch; a plain color input or a fixed palette; `color_hex` stored).
- Deleting a stitch/yarn referenced by days is safe (FK `set null`) but warn in the confirm dialog ("X jours utilisent ce point; ils resteront configurés sans point").
- Sessions-protected; shadcn Table or Card list; French copy.

## Technical notes

- Server actions `src/app/admin/references/actions.ts`; `revalidatePath("/admin")` + list page.
- Day editor modal (step 4) gains "+ Nouveau point / + Nouvelle pelotte" quick-create buttons that open a small nested dialog and insert-then-select the new entity.
- Sorting: alphabetical by name.

## Implementation notes (2026-10-27)

- Single page **`/admin/references`** with client-side tabs (Points / Pelottes), not two routes: both lists are small, one fetch is cheaper.
- `src/app/admin/references/page.tsx` loads both tables with a **left join + `count(calendarDays.id)`** per row → usage counts shown as a "Jours liés" column.
- `actions.ts`: create/update/delete for both entities, plus direct-argument `quickCreateStitchAction(name, fixedRows)` / `quickCreateYarnAction(name, colorHex)` used by the day editor. Uniqueness is **pre-checked** per name (excludes self in update) so failures return French errors instead of raw SQLITE_CONSTRAINT; `fixed_rows` validated 2–5, `color_hex` validated `#rrggbb` (lowercased).
- The grid page renders **`<Badge>N rangs imposés</Badge>` or "2–5 (libre)"**, color dot + hex for yarns; empty lists show a friendly empty-state row.
- Delete dialogs warn with the usage count: "X jour(s) utilisent ce point ; ils resteront configurés sans point" (delete stays a plain `DELETE`, rows become `stitch_id`/`yarn_id` NULL via FK).
- Day editor (`calendar-grid.tsx`): keeps **local copies** `stitchList`/`yarnList` of the reference props; the two nested `QuickCreate*Dialog`s call the quick-create action in a transition, then hand the complete new option to the grid, which appends (alphabetically sorted) and auto-selects it. The outer dialog never closes, so the user keeps their half-filled form.
- Yarn color picker = native `<input type="color">` + hex text input kept in sync, hidden `colorHex` field posts the sanitized value. **Keyed remount** (`key={edit-id | create-open}`) resets the local color per open instead of a `useEffect` (avoids the `react-hooks/set-state-in-effect` lint error).
- Admin header now has nav links: Calendriers / Points & pelottes.
- Fixed a leftover lint error from step 4 while here: the day-editor rows-lock `useEffect` was removed (the disabled input's `value` prop already forces `fixed_rows`).

## Acceptance criteria

- [x] Create/edit/delete stitches with optional imposed rows
- [x] Create/edit/delete yarns with color, dot visible where listed
- [x] Referenced entities deletable without breaking configured days

