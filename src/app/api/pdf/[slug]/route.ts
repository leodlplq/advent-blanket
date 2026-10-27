import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import {
  generateCalendarQrPdf,
  normalizeBaseUrl,
  type QrDayData,
} from "@/lib/qr-pdf";

/**
 * Printable A4 sheet with the 25 labeled QR codes for one participant.
 *
 * Only authenticated backoffice users can generate it (the proxy matcher
 * doesn't cover /api/*, so the session is verified here). The PDF itself is
 * always regenerated — treat it as cheap, it's a single sheet.
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return new Response("Session requise.", { status: 401 });
  }

  const { slug } = await params;

  const [participant] = await db
    .select()
    .from(schema.participants)
    .where(eq(schema.participants.slug, slug))
    .limit(1);
  if (!participant) {
    return new Response("Participante introuvable.", { status: 404 });
  }

  // Configured days are those with a `calendar_days` row; an existing row
  // means the editor was saved with content (empty forms delete the row).
  const dayRows = await db
    .select({ day: schema.calendarDays.day })
    .from(schema.calendarDays)
    .where(eq(schema.calendarDays.participantId, participant.id));
  const configuredDays = new Set(dayRows.map((row) => row.day));

  const days: QrDayData[] = Array.from({ length: 25 }, (_, index) => ({
    day: index + 1,
    configured: configuredDays.has(index + 1),
  }));

  // QR codes must encode a URL reachable from a phone, so the base URL
  // priority is: explicit config → request host (works on the LAN too,
  // e.g. http://192.168.x.x:3000 with `pnpm dev`).
  const configuredBase = process.env.NEXT_PUBLIC_APP_URL
    ? normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL)
    : null;
  const requestUrl = new URL(request.url);
  const fallbackBase =
    configuredBase ?? `${requestUrl.protocol}//${requestUrl.host}`;

  const pdfBytes = await generateCalendarQrPdf({
    participantName: participant.name,
    slug: participant.slug,
    days,
    baseUrl: fallbackBase,
  });

  // ASCII-safe filename (RFC 2047-style backup for accented names).
  const filename = `avent-${participant.slug}-qrcodes.pdf`;

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
