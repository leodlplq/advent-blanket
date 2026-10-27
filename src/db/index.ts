import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

// SQLite file location. Overridable so Coolify can point it at a volume
// (e.g. DATABASE_PATH=/data/advent-blanket.db).
const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const databasePath = path.join(dataDir, "advent-blanket.db");

const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Run pending migrations on every boot: makes deployments stateless-safe,
// no migration step needed in CI or at startup time.
migrate(drizzle(sqlite, { schema }), {
  migrationsFolder: path.join(process.cwd(), "drizzle"),
});

export const db = drizzle(sqlite, { schema });
export type Database = typeof db;
export { schema };
