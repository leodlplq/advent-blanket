#!/usr/bin/env node
/**
 * SQLite backup: force a WAL checkpoint (TRUNCATE merges the -wal file back
 * into the main database and empties it), then copy that single consistent
 * .db file into a backups folder with an hour-stamped name. Keeps the most
 * recent BACKUP_KEEP files, deletes older ones.
 *
 * Usage:
 *   pnpm db:backup                       (dev, DB under ./data)
 *   node /app/scripts/backup.mjs         (container, DB under /data)
 *
 * Wire it to a nightly cron — in Coolify, a scheduled task running
 * `node /app/scripts/backup.mjs` inside the app container.
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "advent-blanket.db");
const backupsDir = process.env.BACKUP_DIR ?? path.join(dataDir, "backups");
const keep = Number(process.env.BACKUP_KEEP ?? 14);

if (!fs.existsSync(dbPath)) {
  console.error(`Backup aborted: no database at ${dbPath}`);
  process.exit(1);
}

// Checkpoint first so the copied file alone (without -wal) is complete.
const db = new Database(dbPath);
db.pragma("wal_checkpoint(TRUNCATE)");
db.close();

fs.mkdirSync(backupsDir, { recursive: true });

// Pure-digit stamp: sorts chronologically and matches the prune regex below.
const now = new Date();
const stamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, "0"),
  String(now.getDate()).padStart(2, "0"),
  String(now.getHours()).padStart(2, "0"),
  String(now.getMinutes()).padStart(2, "0"),
].join("");
const destination = path.join(backupsDir, `advent-blanket-${stamp}.db`);

fs.copyFileSync(dbPath, destination);
console.log(`Backed up ${dbPath} → ${destination}`);

const backups = fs
  .readdirSync(backupsDir)
  .filter((name) => /^advent-blanket-\d{12}\.db$/.test(name))
  .sort()
  .reverse();

for (const stale of backups.slice(keep)) {
  fs.unlinkSync(path.join(backupsDir, stale));
  console.log(`Pruned old backup: ${stale}`);
}
