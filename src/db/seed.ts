import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";

/**
 * Idempotent seed:
 * - one admin account from ADMIN_USERNAME / ADMIN_PASSWORD (or defaults)
 * - the two participants: Clémence and Léo
 * - a few starter stitches and yarns
 *
 * Calendar days stay empty: the backoffice is meant to fill them.
 *
 * Imported by:
 * - scripts/seed.ts (CLI: pnpm db:seed, loads dotenv first)
 * - src/instrumentation.ts (runs once at production server start, so a
 *   fresh deployment bootstraps its own admin — no manual seed step)
 */

export async function runSeed(): Promise<void> {
  // --- Admin ------------------------------------------------------------
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "avent2026";

  const existingAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(schema.users).values({
      username,
      passwordHash: bcrypt.hashSync(password, 10),
    });
    console.log(`✔ admin account created: ${username}`);
  } else {
    console.log(`• admin account already exists: ${username}`);
  }

  // --- Participants -----------------------------------------------------
  const wantedParticipants = [
    { name: "Clémence", slug: "clemence" },
    { name: "Léo", slug: "leo" },
  ];

  for (const wanted of wantedParticipants) {
    const exists = await db
      .select()
      .from(schema.participants)
      .where(eq(schema.participants.slug, wanted.slug))
      .limit(1);
    if (exists.length === 0) {
      await db.insert(schema.participants).values(wanted);
      console.log(`✔ participant created: ${wanted.name}`);
    } else {
      console.log(`• participant already exists: ${wanted.name}`);
    }
  }

  // --- Stitches (fixedRows: exact rows enforced when set) ----------------
  const wantedStitches: { name: string; fixedRows?: number }[] = [
    { name: "Point de jersey" },
    { name: "Point de riz" },
    { name: "Vagues" },
    { name: "Nid d'abeille" },
    { name: "Point d'étoile", fixedRows: 4 },
    { name: "Point lézard", fixedRows: 2 },
  ];

  const stitchNames = db.select().from(schema.stitches).all().map((s) => s.name);
  for (const wanted of wantedStitches) {
    if (!stitchNames.includes(wanted.name)) {
      await db.insert(schema.stitches).values({
        name: wanted.name,
        fixedRows: wanted.fixedRows ?? null,
      });
      console.log(`✔ stitch created: ${wanted.name}`);
    }
  }

  // --- Yarns --------------------------------------------------------------
  const wantedYarns = [
    { name: "Luna Vert", colorHex: "#4f7942" },
    { name: "Luna Rouge", colorHex: "#b0413e" },
    { name: "Luna Bleu", colorHex: "#396394" },
    { name: "Luna Champagne", colorHex: "#e5d3b3" },
    { name: "Luna Gris", colorHex: "#8a8a8a" },
    { name: "Luna Noir", colorHex: "#25242d" },
  ];

  const yarnNames = db.select().from(schema.yarns).all().map((y) => y.name);
  for (const wanted of wantedYarns) {
    if (!yarnNames.includes(wanted.name)) {
      await db.insert(schema.yarns).values(wanted);
      console.log(`✔ yarn created: ${wanted.name}`);
    }
  }

  console.log("Seed done.");
}
