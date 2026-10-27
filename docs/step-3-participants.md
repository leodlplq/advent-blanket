# Step 3 — Backoffice shell: participants management 🔜 next

Goal: turn the `/admin` dashboard stub into working participant management.

## Scope (agreed in session)

- Cards on `/admin` become **clickable links** → `/admin/participants/[slug]` (detail page for one participant's calendar; the 25-day grid itself is step 4 — this page can be a minimal placeholder that step 4 fills).
- **Add participant** — button "Ajouter une personne" → shadcn `Dialog` with name input; **slug auto-generated** from the French name (ASCII-fold accents, lowercase, non-alnum → `-`). Client generates a preview when typing; server **recomputes** the slug on submit (never trust client) and ensures uniqueness (e.g. slug, slug-2, slug-3…).
- **Rename participant** — edit entry (dialog or dropdown-menu action on each card) updating `name`.
- **Delete participation** — destructive action with confirmation dialog; warn that it deletes the participant **and their calendar days** (FK cascade); require typing the name to confirm, or a checkbox — destructive UX is our call, keep it simple but safe. Soft-consider: participants having configured days → wording adapts.
- Keep the "x/25 jours configurés" count badges on cards.
- Everything under `requireSession()` (layout already guarantees it).

## Technical notes

- Use **server actions** in `src/app/admin/participants/actions.ts` ("use server") performing DB writes via drizzle, then `revalidatePath("/admin")` (and detail path if needed).
- Client dialogs live in a small client component receiving the action + existing participants as props; keep data fetching in the server page.
- Slug helpers: write once in `src/lib/utils.ts` or `src/lib/slug.ts` (also used later for seeding new participants).
- Copy in French: "Ajouter une personne", "Modifier", "Supprimer", "Nom", placeholder etc.
- No confirmation toast needed, but `sonner` is installed if we want feedback.

## Acceptance criteria

- [ ] From `/admin` I can add Clémence/Léo-like participant with accented name → correct slug, card appears
- [ ] Rename reflected on the card (and, later, QR label/PDF use the new name)
- [ ] Delete removes the participant + their days (cascade) after an explicit confirmation
- [ ] Duplicate names get unique slugs (clemence, clemence-2)
- [ ] All actions are session-protected (layout + server action)

## Out of scope (later steps)

- The 25-day grid → step 4
- PDF/QR — step 6
