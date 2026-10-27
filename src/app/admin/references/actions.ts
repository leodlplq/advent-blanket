"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Reference management actions (stitches & yarns).
 *
 * Names are unique (DB constraint) — we also pre-check so the failure comes
 * back as a French error message instead of an unhandled constraint error.
 *
 * Deleting a reference is always safe: calendar_days FKs are ON DELETE SET NULL,
 * so configured days keep existing, just without that stitch/yarn.
 */

export interface ReferenceActionState {
  ok?: boolean;
  error?: string;
}

export interface QuickCreateResult extends ReferenceActionState {
  id?: number;
}

function parseId(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function validateFixedRows(
  raw: FormDataEntryValue | null,
): { fixedRows: number | null; error?: string } {
  const text = String(raw ?? "").trim();
  if (text === "") return { fixedRows: null };
  const n = Number(text);
  if (!Number.isInteger(n) || n < 2 || n > 5) {
    return { fixedRows: null, error: "Les rangs imposés doivent être un nombre entier entre 2 et 5." };
  }
  return { fixedRows: n };
}

function validateColorHex(raw: FormDataEntryValue | null): { colorHex: string; error?: string } {
  const text = String(raw ?? "").trim();
  if (!/^#[0-9a-f]{6}$/i.test(text)) {
    return { colorHex: "#cccccc", error: "La couleur doit être au format #RRGGBB." };
  }
  return { colorHex: text.toLowerCase() };
}

// --- Stitches -----------------------------------------------------------------

export async function createStitchAction(
  _prevState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Veuillez indiquer un nom." };

  const { fixedRows, error } = validateFixedRows(formData.get("fixedRows"));
  if (error) return { error };

  const [existing] = await db
    .select({ id: schema.stitches.id })
    .from(schema.stitches)
    .where(eq(schema.stitches.name, name))
    .limit(1);
  if (existing) return { error: "Un point porte déjà ce nom." };

  await db.insert(schema.stitches).values({ name, fixedRows });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function updateStitchAction(
  _prevState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const id = parseId(formData.get("id"));
  if (!id) return { error: "Point inconnu." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Veuillez indiquer un nom." };

  const { fixedRows, error } = validateFixedRows(formData.get("fixedRows"));
  if (error) return { error };

  const [existing] = await db
    .select({ id: schema.stitches.id })
    .from(schema.stitches)
    .where(and(eq(schema.stitches.name, name), ne(schema.stitches.id, id)))
    .limit(1);
  if (existing) return { error: "Un point porte déjà ce nom." };

  await db
    .update(schema.stitches)
    .set({ name, fixedRows })
    .where(eq(schema.stitches.id, id));

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteStitchAction(
  _prevState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const id = parseId(formData.get("id"));
  if (!id) return { error: "Point inconnu." };

  // calendar_days.stitch_id is FK ON DELETE SET NULL → days stay configured.
  await db.delete(schema.stitches).where(eq(schema.stitches.id, id));

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// --- Yarns --------------------------------------------------------------------

export async function createYarnAction(
  _prevState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Veuillez indiquer un nom." };

  const { colorHex, error } = validateColorHex(formData.get("colorHex"));
  if (error) return { error };

  const [existing] = await db
    .select({ id: schema.yarns.id })
    .from(schema.yarns)
    .where(eq(schema.yarns.name, name))
    .limit(1);
  if (existing) return { error: "Une pelotte porte déjà ce nom." };

  await db.insert(schema.yarns).values({ name, colorHex });

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function updateYarnAction(
  _prevState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const id = parseId(formData.get("id"));
  if (!id) return { error: "Pelotte inconnue." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Veuillez indiquer un nom." };

  const { colorHex, error } = validateColorHex(formData.get("colorHex"));
  if (error) return { error };

  const [existing] = await db
    .select({ id: schema.yarns.id })
    .from(schema.yarns)
    .where(and(eq(schema.yarns.name, name), ne(schema.yarns.id, id)))
    .limit(1);
  if (existing) return { error: "Une pelotte porte déjà ce nom." };

  await db
    .update(schema.yarns)
    .set({ name, colorHex })
    .where(eq(schema.yarns.id, id));

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteYarnAction(
  _prevState: ReferenceActionState,
  formData: FormData,
): Promise<ReferenceActionState> {
  const id = parseId(formData.get("id"));
  if (!id) return { error: "Pelotte inconnue." };

  // calendar_days.yarn_id is FK ON DELETE SET NULL → days stay configured.
  await db.delete(schema.yarns).where(eq(schema.yarns.id, id));

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// --- Quick-create (day editor "+ Nouveau point / + Nouvelle pelotte") -----------

export async function quickCreateStitchAction(
  name: string,
  fixedRows: number | null,
): Promise<QuickCreateResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Veuillez indiquer un nom." };
  if (fixedRows != null && (!Number.isInteger(fixedRows) || fixedRows < 2 || fixedRows > 5)) {
    return { error: "Les rangs imposés doivent être un nombre entier entre 2 et 5." };
  }

  const [existing] = await db
    .select({ id: schema.stitches.id })
    .from(schema.stitches)
    .where(eq(schema.stitches.name, trimmed))
    .limit(1);
  if (existing) return { error: "Un point porte déjà ce nom." };

  const [created] = await db
    .insert(schema.stitches)
    .values({ name: trimmed, fixedRows })
    .returning({ id: schema.stitches.id });

  revalidatePath("/admin", "layout");
  return { ok: true, id: created.id };
}

export async function quickCreateYarnAction(
  name: string,
  colorHex: string,
): Promise<QuickCreateResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Veuillez indiquer un nom." };

  const safeColor = /^#[0-9a-f]{6}$/i.test(colorHex.trim())
    ? colorHex.trim().toLowerCase()
    : "#cccccc";

  const [existing] = await db
    .select({ id: schema.yarns.id })
    .from(schema.yarns)
    .where(eq(schema.yarns.name, trimmed))
    .limit(1);
  if (existing) return { error: "Une pelotte porte déjà ce nom." };

  const [created] = await db
    .insert(schema.yarns)
    .values({ name: trimmed, colorHex: safeColor })
    .returning({ id: schema.yarns.id });

  revalidatePath("/admin", "layout");
  return { ok: true, id: created.id };
}
