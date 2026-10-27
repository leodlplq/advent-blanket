import { count } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  ParticipantsManager,
  type ParticipantCardData,
} from "@/app/admin/participants/participants-manager";

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

  const data: ParticipantCardData[] = participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    slug: participant.slug,
    dayCount: configuredDaysByParticipant.get(participant.id) ?? 0,
  }));

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Calendriers de l&apos;Avent
        </h1>
      </div>
      <ParticipantsManager participants={data} />
    </div>
  );
}
