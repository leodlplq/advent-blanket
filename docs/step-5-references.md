# Step 5 — Reference management (stitches & yarns) 🔜 todo

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

## Acceptance criteria

- [ ] Create/edit/delete stitches with optional imposed rows
- [ ] Create/edit/delete yarns with color, dot visible where listed
- [ ] Referenced entities deletable without breaking configured days
