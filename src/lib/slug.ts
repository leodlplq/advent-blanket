import { like } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Turn a human name into a URL-safe slug.
 * Handles French accents: "Clémence V." → "clemence-v"
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Find the first free slug among `base`, `base-2`, `base-3`, ...
 * Only used at creation time: slugs are never regenerated afterwards
 * (they appear in QR links, so renaming a participant must keep the slug).
 */
export async function buildUniqueSlug(base: string): Promise<string> {
  const prefix = base || "participant";

  const clashes = await db
    .select({ slug: schema.participants.slug })
    .from(schema.participants)
    .where(like(schema.participants.slug, `${prefix}%`));

  const taken = new Set(clashes.map((row) => row.slug));
  if (!taken.has(prefix)) return prefix;

  let candidate = 2;
  while (taken.has(`${prefix}-${candidate}`)) candidate++;
  return `${prefix}-${candidate}`;
}
