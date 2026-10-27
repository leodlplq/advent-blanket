# Step 3 — Backoffice shell: participants management ✅ done

## What was built

- `src/lib/slug.ts` — `slugify()` (ASCII-fold accents, lowercase, alnum+dashes) and `buildUniqueSlug()` (`base`, `base-2`, …). Slugs are generated **only at creation** and never on rename: they are part of the QR links `/cal/{slug}/{day}`.
- `src/app/admin/participants/actions.ts` — server actions with `ParticipantActionState { ok?, error? }` shared by add/rename/delete:
  - `createParticipantAction` — validates name, recomputes slug server-side (never trusts the client), inserts, `revalidatePath("/admin", "layout")`
  - `renameParticipantAction` — updates `name` **only** (slug untouched, same reason as above)
  - `deleteParticipantAction` — deletes participant; their `calendar_days` rows cascade (FK)
- `src/app/admin/participants/participants-manager.tsx` — client component consuming server data:
  - **Add** button + Dialog ("Ajouter une personne")
  - Cards with **stretched-link overlay** (whole card clickable → `/admin/participants/[slug]`), dropdown menu (…): Modifier / Supprimer (destructive-styled)
  - Rename dialog with notice "les QR codes restent valables"; delete dialog shows day count + "définitif" warning
  - `useActionState` + `useFormStatus` pending labels (French), sonner toasts on success (`useCloseOnSuccess` helper), `<Toaster />` rendered inside the manager
- `src/app/admin/page.tsx` — loads participants + day counts, passes `{id, name, slug, dayCount}[]` to the manager
- `src/app/admin/participants/[slug]/page.tsx` — detail placeholder (Back link, name, "x/25 jours configurés", dashed placeholder for the step 4 grid); `notFound()` on unknown slug

## Verified

- tsc clean, `pnpm build` green (`/admin/participants/[slug]` dynamic route registered)
- Live: `/admin` shows "Ajouter une personne" + links `/admin/participants/clemence` and `/leo`; detail page 200; unknown slug → 404

## Notes for later steps

- Next 16 detail: in the rename/delete dialogs, `key={participant.id}` on the form remounts fields when switching participants.
- Toaster is scoped inside ParticipantsManager for now — move it to the root layout when more admin pages show toasts.
- "Clickable card + menu" pattern to reuse: `CardHeader` with a `Link` using `absolute inset-0` overlay, and the menu button wrapper kept at `z-10`.
