import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, schema } from "@/db";
import { ADVENT_DAYS, ADVENT_YEAR } from "@/lib/advent";

/**
 * Public day page, the landing for the printed QR codes:
 * /cal/{slug}/{day} — guessable by design, no auth.
 *
 * Designed to be read on a phone at arm's length (possibly in the dark,
 * with nails-in-the-way hands): very large text, dominant rows count,
 * everything vertically stacked.
 *
 * The public page always renders with the dark theme (the `dark` class on
 * the wrapper) — festive, and easiest to read next to a Christmas tree.
 */

// Page reads the DB at request time; never cache a day someone is editing.
export const dynamic = "force-dynamic";

const dayDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

function dayDate(day: number): string {
  return dayDateFormatter.format(new Date(ADVENT_YEAR, 11, day));
}

// --- Data loader -------------------------------------------------------------

interface LoadedDay {
  participantName: string;
  stitchName: string | null;
  fixedRows: number | null;
  savedRows: number | null;
  yarnName: string | null;
  yarnColor: string | null;
  tutoUrl: string | null;
  notes: string | null;
}

async function loadDay(
  slug: string,
  day: number,
): Promise<{ participantName: string; dayRow: LoadedDay | null } | null> {
  const [participant] = await db
    .select({ id: schema.participants.id, name: schema.participants.name })
    .from(schema.participants)
    .where(eq(schema.participants.slug, slug))
    .limit(1);
  if (!participant) return null;

  const [dayRow] = await db
    .select({
      stitchName: schema.stitches.name,
      fixedRows: schema.stitches.fixedRows,
      savedRows: schema.calendarDays.rows,
      tutoUrl: schema.calendarDays.tutoUrl,
      notes: schema.calendarDays.notes,
      yarnName: schema.yarns.name,
      yarnColor: schema.yarns.colorHex,
    })
    .from(schema.calendarDays)
    .leftJoin(
      schema.stitches,
      eq(schema.calendarDays.stitchId, schema.stitches.id),
    )
    .leftJoin(schema.yarns, eq(schema.calendarDays.yarnId, schema.yarns.id))
    .where(
      and(
        eq(schema.calendarDays.participantId, participant.id),
        eq(schema.calendarDays.day, day),
      ),
    )
    .limit(1);

  return dayRow
    ? { participantName: participant.name, dayRow: dayRow as LoadedDay }
    : { participantName: participant.name, dayRow: null };}

// --- Route entry points ------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; day: string }>;
}): Promise<Metadata> {
  const { slug, day } = await params;
  const data = parseDayParam(day);
  if (data === null) {
    return { title: "Advent Blanket" };
  }
  const loaded = await loadDay(slug, data);
  return {
    title: loaded
      ? `Jour ${data} · Calendrier de l'Avent de ${loaded.participantName}`
      : "Advent Blanket",
    description: `Jour ${data} (${dayDate(data)} ${ADVENT_YEAR}) du calendrier de l'Avent au crochet : le point du jour, le nombre de rangs et la pelotte.`,
  };
}

/** Day URL path segment → 1–24, or null (→ 404). */
function parseDayParam(raw: string): number | null {
  const day = Number(raw);
  return Number.isInteger(day) && day >= 1 && day <= ADVENT_DAYS ? day : null;
}

export default async function PublicDayPage({
  params,
}: {
  params: Promise<{ slug: string; day: string }>;
}) {
  const { slug, day: dayParam } = await params;
  const day = parseDayParam(dayParam);

  // Unknown participant OR invalid day (0, 25+, "abc", injection attempts).
  if (day === null) notFound();
  const loaded = await loadDay(slug, day);
  if (!loaded) notFound();

  // Participant exists but this day isn't prepared yet → friendly page, not a 404.
  if (loaded.dayRow === null) {
    return (
      <DayShell day={day} participantName={loaded.participantName}>
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Gift className="size-10 text-muted-foreground" aria-hidden />
          <p className="font-heading text-xl">
            Ce jour n&apos;est pas encore prêt…
          </p>
          <p className="text-sm text-muted-foreground">
            Reviens bientôt : la touffe magique arrive en avance. 🧶
          </p>
        </div>
      </DayShell>
    );
  }

  const { dayRow } = loaded;

  const rowsCount = dayRow.savedRows ?? dayRow.fixedRows ?? null;

  return (
    <DayShell day={day} participantName={loaded.participantName}>
      {/* Point du jour ------------------------------------------------------- */}
      <section className="grid gap-1.5">
        <SectionLabel>Point du jour</SectionLabel>
        {dayRow.stitchName ? (
          <p className="font-heading text-4xl leading-tight">
            {dayRow.stitchName}
          </p>
        ) : (
          <p className="text-lg text-muted-foreground">
            Aucun point indiqué pour ce jour.
          </p>
        )}
      </section>

      {/* Nombre de rangs — the info you tend to forget ---------------------- */}
      <section className="grid gap-1.5 rounded-2xl border border-red-500/25 bg-red-500/10 px-6 py-5 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-red-400/80">
          Nombre de rangs
        </p>
        {rowsCount != null ? (
          <>
            <p className="font-heading text-8xl font-semibold leading-none text-red-400">
              {rowsCount}
            </p>
            <p className="text-xl font-medium text-red-300/90">
              {rowsCount === 1 ? "rang" : "rangs"}
            </p>
          </>
        ) : (
          <p className="py-2 text-xl text-muted-foreground">
            Laisse le hasard choisir, entre 2 et 5 rangs.
          </p>
        )}
      </section>

      {/* Pelotte ------------------------------------------------------------ */}
      <section className="grid gap-3">
        <SectionLabel>Pelotte</SectionLabel>
        {dayRow.yarnName && dayRow.yarnColor ? (
          <div className="flex items-center gap-4 rounded-2xl border bg-card py-4 pr-5 pl-4">
            {/* Bigger swatch so the shade is recognizable in a yarn basket. */}
            <span
              className="size-10 shrink-0 rounded-full ring-2 ring-ring/40"
              style={{ backgroundColor: dayRow.yarnColor }}
              aria-hidden
            />
            <p className="text-2xl font-medium">{dayRow.yarnName}</p>
          </div>
        ) : (
          <p className="text-lg text-muted-foreground">
            Aucune pelotte indiquée pour ce jour.
          </p>
        )}
      </section>

      {/* Lien du tuto -------------------------------------------------------- */}
      {dayRow.tutoUrl ? (
        <Button asChild size="lg" className="h-14 w-full text-lg">
          {/* Web TikTok/YouTube/Instagram URLs deep-link into their apps. */}
          <a href={dayRow.tutoUrl} target="_blank" rel="noopener">
            📺 Voir le tuto
          </a>
        </Button>
      ) : null}

      {/* Notes (markdown léger) --------------------------------------------- */}
      {dayRow.notes ? (
        <section className="grid gap-1.5">
          <SectionLabel>Notes</SectionLabel>
          {/* Arbitrary-variant selectors style exactly the supported markdown
              subset; <img> stays allowed for uploaded photos. */}
          <div className="rounded-2xl border bg-card p-4 text-[15px] leading-relaxed [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_code]:font-mono [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_hr]:my-3 [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:ms-5 [&_ol]:list-decimal [&_p]:my-1.5 [&_ul]:list-disc">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Notes links open like the tutorial button.
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener" className="underline">
                    {children}
                  </a>
                ),
              }}
            >
              {dayRow.notes}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
    </DayShell>
  );
}

// --- Shared building blocks --------------------------------------------------

/** Page frame: always-dark wrapper, header with day + name + date. */
function DayShell({
  day,
  participantName,
  children,
}: {
  day: number;
  participantName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-svh bg-background font-sans text-foreground">
      <main className="mx-auto flex w-full max-w-md flex-col gap-7 px-5 pt-10 pb-14">
        <header className="text-center">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Jour {day} sur {ADVENT_DAYS} · {dayDate(day)} {ADVENT_YEAR}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            {participantName}
          </h1>
        </header>
        {children}
        <p className="mt-auto pt-4 text-center text-xs text-muted-foreground">
          ✨ Calendrier de l&apos;Avent au crochet — un point, une pelotte, {ADVENT_DAYS} jours
        </p>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}
