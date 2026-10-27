import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  ReferencesManager,
  type StitchRowData,
  type YarnRowData,
} from "./references-manager";

export const metadata = {
  title: "Références — Advent Blanket",
};

export default async function ReferencesPage() {
  // Usage counts (how many configured days reference each entry) feed the
  // delete-confirmation warnings. Left joins keep unreferenced rows at 0.
  const [stitchRows, yarnRows] = await Promise.all([
    db
      .select({
        id: schema.stitches.id,
        name: schema.stitches.name,
        fixedRows: schema.stitches.fixedRows,
        usage: count(schema.calendarDays.id),
      })
      .from(schema.stitches)
      .leftJoin(
        schema.calendarDays,
        eq(schema.calendarDays.stitchId, schema.stitches.id),
      )
      .groupBy(schema.stitches.id)
      .orderBy(schema.stitches.name),
    db
      .select({
        id: schema.yarns.id,
        name: schema.yarns.name,
        colorHex: schema.yarns.colorHex,
        usage: count(schema.calendarDays.id),
      })
      .from(schema.yarns)
      .leftJoin(
        schema.calendarDays,
        eq(schema.calendarDays.yarnId, schema.yarns.id),
      )
      .groupBy(schema.yarns.id)
      .orderBy(schema.yarns.name),
  ]);

  const stitches: StitchRowData[] = stitchRows.map((row) => ({
    id: row.id,
    name: row.name,
    fixedRows: row.fixedRows,
    usage: row.usage,
  }));
  const yarns: YarnRowData[] = yarnRows.map((row) => ({
    id: row.id,
    name: row.name,
    colorHex: row.colorHex,
    usage: row.usage,
  }));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Points &amp; pelottes
        </h1>
        <p className="text-sm text-muted-foreground">
          Points et pelottes proposés dans l&apos;éditeur de jour, pour tous
          les calendriers.
        </p>
      </div>
      <ReferencesManager stitches={stitches} yarns={yarns} />
    </div>
  );
}
