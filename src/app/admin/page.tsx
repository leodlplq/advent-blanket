import { count } from "drizzle-orm";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, schema } from "@/db";

export default async function AdminPage() {
  const participants = await db
    .select()
    .from(schema.participants)
    .orderBy(schema.participants.name);

  const dayCounts = await db
    .select({
      participantId: schema.calendarDays.participantId,
      dayCount: count(),
    })
    .from(schema.calendarDays)
    .groupBy(schema.calendarDays.participantId);

  const configuredDaysByParticipant = new Map(
    dayCounts.map((entry) => [entry.participantId, entry.dayCount]),
  );

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Calendriers de l&apos;Avent
        </h1>
        <p className="text-sm text-muted-foreground">
          Sélectionnez une personne pour préparer ses 25 jours.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {participants.map((participant) => (
          <Card key={participant.id}>
            <CardHeader>
              <CardTitle>{participant.name}</CardTitle>
              <CardDescription>
                {configuredDaysByParticipant.get(participant.id) ?? 0}
                /25 jours configurés
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
