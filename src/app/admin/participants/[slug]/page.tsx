import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, schema } from "@/db";
import { notFound } from "next/navigation";
import {
  CalendarGrid,
  type CalendarDayData,
} from "./calendar-grid";

export default async function ParticipantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [participant] = await db
    .select()
    .from(schema.participants)
    .where(eq(schema.participants.slug, slug))
    .limit(1);

  if (!participant) {
    notFound();
  }

  const [{ dayCount } = { dayCount: 0 }] = await db
    .select({ dayCount: count() })
    .from(schema.calendarDays)
    .where(eq(schema.calendarDays.participantId, participant.id));

  // Days existing in DB + placeholder cells for the always-present 25 slots.
  const dayRows = await db
    .select()
    .from(schema.calendarDays)
    .where(eq(schema.calendarDays.participantId, participant.id))
    .orderBy(schema.calendarDays.day);
  const dayByNumber = new Map(dayRows.map((row) => [row.day, row]));
  const cells: CalendarDayData[] = Array.from({ length: 25 }, (_, index) => {
    const day = index + 1;
    const row = dayByNumber.get(day);
    return row
      ? {
          day,
          configured: true,
          stitchId: row.stitchId,
          yarnId: row.yarnId,
          rows: row.rows,
          tutoUrl: row.tutoUrl,
          notes: row.notes,
        }
      : {
          day,
          configured: false,
          stitchId: null,
          yarnId: null,
          rows: null,
          tutoUrl: null,
          notes: null,
        };
  });

  // Reference lists for the editor selects (step 5 adds their CRUD).
  const [stitchOptions, yarnOptions] = await Promise.all([
    db
      .select({
        id: schema.stitches.id,
        name: schema.stitches.name,
        fixedRows: schema.stitches.fixedRows,
      })
      .from(schema.stitches)
      .orderBy(schema.stitches.name),
    db
      .select({
        id: schema.yarns.id,
        name: schema.yarns.name,
        colorHex: schema.yarns.colorHex,
      })
      .from(schema.yarns)
      .orderBy(schema.yarns.name),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-2 -ml-2 text-muted-foreground"
        >
          <Link href="/admin">
            <ArrowLeft aria-hidden /> Calendriers
          </Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {participant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {dayCount}/25 jours configurés
            </p>
          </div>
          {/* Printable A4 sheet with the 25 labeled QR codes. */}
          <Button asChild variant="outline" size="sm">
            <a href={`/api/pdf/${participant.slug}`} download>
              <Download aria-hidden /> PDF des QR codes
            </a>
          </Button>
        </div>
      </div>

      {/* The 25-day grid; clicking a cell opens the day editor dialog. */}
      <CalendarGrid
        participantId={participant.id}
        participantName={participant.name}
        participantSlug={participant.slug}
        days={cells}
        stitches={stitchOptions}
        yarns={yarnOptions}
      />
    </div>
  );
}
