import { sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestampNow = sql`(unixepoch())`;

// Admin accounts for the backoffice. One shared account for now,
// but the table is there so adding more users later is trivial.
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .default(timestampNow),
});

// People having a calendar (Clémence, Léo, ...).
export const participants = sqliteTable("participants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at")
    .notNull()
    .default(timestampNow),
});

// Crochet stitches reusable across days and participants.
// fixedRows: when set, a day using this stitch must use exactly that number
// of rows (the rows field becomes locked in the editor form).
export const stitches = sqliteTable("stitches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  fixedRows: integer("fixed_rows"),
  createdAt: integer("created_at")
    .notNull()
    .default(timestampNow),
});

// Yarn balls reusable across days and participants.
export const yarns = sqliteTable("yarns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  colorHex: text("color_hex").notNull().default("#cccccc"),
  createdAt: integer("created_at")
    .notNull()
    .default(timestampNow),
});

// One entry per participant per day (1–24 December).
// All fields are optional so a day can be prepared incrementally.
export const calendarDays = sqliteTable(
  "calendar_days",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    participantId: integer("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    day: integer("day").notNull(), // 1–24
    stitchId: integer("stitch_id").references(() => stitches.id, {
      onDelete: "set null",
    }),
    yarnId: integer("yarn_id").references(() => yarns.id, {
      onDelete: "set null",
    }),
    rows: integer("rows", { mode: "number" }),
    tutoUrl: text("tuto_url"),
    notes: text("notes"), // optional markdown/plain notes (photos, links, text)
    updatedAt: integer("updated_at")
      .notNull()
      .default(timestampNow),
  },
  (table) => [uniqueIndex("calendar_days_participant_day").on(table.participantId, table.day)],
);
