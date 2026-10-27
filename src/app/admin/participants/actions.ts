"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { buildUniqueSlug, slugify } from "@/lib/slug";

/**
 * Participant management actions.
 * All write to the DB, then invalidate /admin (layout scope, which also
 * covers /admin/participants/*).
 */

export interface ParticipantActionState {
  ok?: boolean;
  error?: string;
}

export async function createParticipantAction(
  _prevState: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Veuillez indiquer un nom." };
  }

  const slug = await buildUniqueSlug(slugify(name));
  await db.insert(schema.participants).values({ name, slug });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function renameParticipantAction(
  _prevState: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();

  if (!id || Number.isNaN(id)) {
    return { error: "Participant inconnu." };
  }
  if (!name) {
    return { error: "Veuillez indiquer un nom." };
  }

  // Note: the slug is intentionally NOT regenerated here —
  // it is part of the QR links /cal/{slug}/{day}.
  await db
    .update(schema.participants)
    .set({ name })
    .where(eq(schema.participants.id, id));

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteParticipantAction(
  _prevState: ParticipantActionState,
  formData: FormData,
): Promise<ParticipantActionState> {
  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) {
    return { error: "Participant inconnu." };
  }

  // calendar_days rows are removed automatically (FK ON DELETE CASCADE).
  await db
    .delete(schema.participants)
    .where(eq(schema.participants.id, id));

  revalidatePath("/admin", "layout");
  return { ok: true };
}
