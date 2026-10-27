/**
 * Boot-time bootstrap (Next.js instrumentation hook): when a production
 * server starts — including the standalone container — run the idempotent
 * seed so a fresh deployment immediately has its admin account, the two
 * participants and the starter references. Migrations already run inside
 * the first DB import (src/db/index.ts).
 *
 * Skipped in development to keep `pnpm dev` quiet; dev uses `pnpm db:seed`.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  try {
    const { runSeed } = await import("./db/seed");
    await runSeed();
  } catch (error) {
    console.error("[advent-blanket] Boot seed failed:", error);
  }
}
