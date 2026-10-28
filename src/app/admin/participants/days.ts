"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { ADVENT_DAYS } from "@/lib/advent";

/**
 * Calendar day actions (save / clear).
 *
 * The rows rule is enforced server-side, never trusted from the form:
 * - stitch has `fixed_rows` → persisted rows = that value (form input ignored)
 * - otherwise rows must be an integer in 2–5 (optional if not filled)
 *
 * A day row only exists in `calendar_days` if at least one field is set:
 * saving an all-empty form deletes the row instead of inserting a stub.
 */

export interface DayActionState {
  ok?: boolean;
  error?: string;
}

function parseId(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function saveDayAction(
  _prevState: DayActionState,
  formData: FormData,
): Promise<DayActionState> {
  const participantId = parseId(formData.get("participantId"));
  const day = Number(formData.get("day"));

  if (!participantId) {
    return { error: "Participant inconnu." };
  }
  if (!Number.isInteger(day) || day < 1 || day > ADVENT_DAYS) {
    return { error: "Jour invalide." };
  }

  // --- Stitch (validated: we need its fixed_rows anyway) -------------------
  const stitchId = parseId(formData.get("stitchId"));
  let rows: number | null = null;
  let fixedRows: number | null = null;

  if (stitchId) {
    const [stitch] = await db
      .select()
      .from(schema.stitches)
      .where(eq(schema.stitches.id, stitchId))
      .limit(1);
    if (!stitch) {
      return { error: "Point sélectionné introuvable." };
    }
    fixedRows = stitch.fixedRows ?? null;
  }

  // --- Rows ---------------------------------------------------------------
  const rawRows = String(formData.get("rows") ?? "").trim();
  if (fixedRows != null) {
    rows = fixedRows;
  } else if (rawRows !== "") {
    const n = Number(rawRows);
    if (!Number.isInteger(n) || n < 2 || n > 5) {
      return { error: "Le nombre de rangs doit être un nombre entier entre 2 et 5." };
    }
    rows = n;
  }

  // --- Yarn / URL / notes ---------------------------------------------------
  const yarnId = parseId(formData.get("yarnId"));
  const tutoUrl = String(formData.get("tutoUrl") ?? "").trim();
  if (tutoUrl && !/^https?:\/\//i.test(tutoUrl)) {
    return {
      error: "Le lien du tuto doit commencer par http:// ou https://.",
    };
  }
  const notes = String(formData.get("notes") ?? "").trim();

  // --- Empty form → remove the day row instead of storing a stub -----------
  const hasContent =
    stitchId !== null ||
    yarnId !== null ||
    rows !== null ||
    tutoUrl !== "" ||
    notes !== "";

  try {
    if (!hasContent) {
      await db
        .delete(schema.calendarDays)
        .where(
          and(
            eq(schema.calendarDays.participantId, participantId),
            eq(schema.calendarDays.day, day),
          ),
        );
    } else {
      const values = {
        stitchId,
        yarnId,
        rows,
        tutoUrl: tutoUrl === "" ? null : tutoUrl,
        notes: notes === "" ? null : notes,
        updatedAt: sql`(unixepoch())`,
      };
      await db
        .insert(schema.calendarDays)
        .values({ participantId, day, ...values })
        .onConflictDoUpdate({
          target: [schema.calendarDays.participantId, schema.calendarDays.day],
          set: values,
        });
    }
  } catch (error) {
    console.error("saveDayAction failed:", error);
    return { error: "Échec de l'enregistrement. Réessayez." };
  }

  // "layout" scope also re-renders /admin (card counts) and this grid page.
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function clearDayAction(
  participantId: number,
  day: number,
): Promise<DayActionState> {
  if (!Number.isInteger(participantId) || participantId <= 0) {
    return { error: "Participant inconnu." };
  }
  if (!Number.isInteger(day) || day < 1 || day > ADVENT_DAYS) {
    return { error: "Jour invalide." };
  }

  try {
    await db
      .delete(schema.calendarDays)
      .where(
        and(
          eq(schema.calendarDays.participantId, participantId),
          eq(schema.calendarDays.day, day),
        ),
      );
  } catch (error) {
    console.error("clearDayAction failed:", error);
    return { error: "Échec de la suppression. Réessayez." };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
