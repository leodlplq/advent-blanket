import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db, schema } from "@/db";
import { notFound } from "next/navigation";

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
        <h1 className="text-2xl font-semibold tracking-tight">
          {participant.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {dayCount}/25 jours configurés
        </p>
      </div>

      {/* Placeholder until step 4: the 25-day grid goes here. */}
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        La grille des 25 jours sera disponible à l&apos;étape suivante.
      </div>
    </div>
  );
}
