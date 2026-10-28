import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { ADVENT_DAYS, ADVENT_YEAR } from "./advent";

/**
 * A4 printable sheet: 24 labeled QR codes (one per December day) in a
 * scissor-friendly 4×6 grid.
 *
 * Text uses the standard Helvetica fonts (WinAnsi encoding covers the
 * French accents we need). QR images are generated as PNG buffers with
 * `qrcode` before being embedded.
 *
 * Structure/format decisions:
 * - portrait A4, 4×6 grid, each cell = dashed border (cut line) containing
 *   the QR code on top and its label ("Jour N — N décembre") underneath;
 * - days that are not configured yet get a grayed-out placeholder cell
 *   ("Non configuré") so the missing prep is visible at a glance;
 * - the participant name lives in the sheet header, the labels carry the
 *   day number + date → unambiguous mapping.
 */

// Shared constant; see src/lib/advent.ts.

// A4 in points.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

// Layout metrics (points).
const MARGIN = 34;
const GRID_GAP = 9;
const HEADER_HEIGHT = 62;

const GRID_COLS = 4;
const GRID_ROWS = Math.ceil(ADVENT_DAYS / GRID_COLS);

const CELL_WIDTH =
  (PAGE_WIDTH - MARGIN * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const CELL_HEIGHT =
  (PAGE_HEIGHT - MARGIN * 2 - HEADER_HEIGHT - GRID_GAP * (GRID_ROWS - 1)) /
  GRID_ROWS;

// QR square sits inside the cell, centered horizontally.
const QR_IMAGE_SIZE = Math.min(CELL_WIDTH * 0.82, CELL_HEIGHT - 28);

const INK = rgb(0.1, 0.1, 0.1);
const MUTED = rgb(0.45, 0.45, 0.45);
const WHITE = rgb(1, 1, 1);

export interface QrDayData {
  day: number;
  configured: boolean;
}

export interface QrPdfInput {
  participantName: string;
  /** URL slug (the QR encodes {baseUrl}/cal/{slug}/{day}). */
  slug: string;
  days: QrDayData[];
  /** Absolute base URL without trailing slash, e.g. "https://avent.example.com". */
  baseUrl: string;
}

const dayDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
});

function dayDate(day: number): string {
  return dayDateFormatter.format(new Date(ADVENT_YEAR, 11, day));
}

export async function generateCalendarQrPdf(
  input: QrPdfInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Calendrier de l'Avent ${ADVENT_YEAR} — ${input.participantName}`);
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // --- Sheet header ----------------------------------------------------------

  const title = `Calendrier de l'Avent ${ADVENT_YEAR} — ${input.participantName}`;
  page.drawText(title, {
    x: MARGIN,
    y: PAGE_HEIGHT - MARGIN - 15,
    size: 14.5,
    font: fontBold,
    color: INK,
  });
  page.drawText(
    "Découpez chaque QR code : il ouvre le calendrier de son jour, directement sur le téléphone.",
    {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 30,
      size: 8.5,
      font,
      color: MUTED,
    },
  );

  // --- Grid cells ------------------------------------------------------------

  for (let index = 0; index < ADVENT_DAYS; index += 1) {
    const day = index + 1;
    const dayData =
      input.days.find((entry) => entry.day === day) ?? { day, configured: false };

    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    const x = MARGIN + col * (CELL_WIDTH + GRID_GAP);
    // First row starts under the header; rows stack toward the bottom.
    const y =
      PAGE_HEIGHT -
      MARGIN -
      HEADER_HEIGHT -
      (row + 1) * CELL_HEIGHT -
      row * GRID_GAP;

    // Dashed box = cut line.
    page.drawRectangle({
      x,
      y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      color: WHITE,
      borderColor: rgb(0.75, 0.75, 0.75),
      borderWidth: 0.7,
      borderDashArray: [3, 3],
    });

    if (dayData.configured) {
      const url = `${input.baseUrl}/cal/${input.slug}/${day}`;
      const png = await QRCode.toBuffer(url, {
        margin: 1,
        width: 256,
        errorCorrectionLevel: "M",
      });
      const image = await pdf.embedPng(png);
      const qrX = x + (CELL_WIDTH - QR_IMAGE_SIZE) / 2;
      const qrY = y + CELL_HEIGHT - 7 - QR_IMAGE_SIZE;
      page.drawImage(image, {
        x: qrX,
        y: qrY,
        width: QR_IMAGE_SIZE,
        height: QR_IMAGE_SIZE,
      });

      const label = `Jour ${day} — ${dayDate(day)}`;
      const labelSize = 7.6;
      const labelWidth = fontBold.widthOfTextAtSize(label, labelSize);
      page.drawText(label, {
        x: x + (CELL_WIDTH - labelWidth) / 2,
        y: qrY - 13,
        size: labelSize,
        font: fontBold,
        color: INK,
      });
    } else {
      const sublabel = `${dayDate(day)} · Non configuré`;
      const labelWidth = fontBold.widthOfTextAtSize(`Jour ${day}`, 9);
      const sublabelWidth = font.widthOfTextAtSize(sublabel, 7.5);
      page.drawText(`Jour ${day}`, {
        x: x + (CELL_WIDTH - labelWidth) / 2,
        y: y + CELL_HEIGHT / 2 + 4,
        size: 9,
        font: fontBold,
        color: MUTED,
      });
      page.drawText(sublabel, {
        x: x + (CELL_WIDTH - sublabelWidth) / 2,
        y: y + CELL_HEIGHT / 2 - 8,
        size: 7.5,
        font,
        color: MUTED,
      });
    }
  }

  return pdf.save();
}

/** Trailing slash / whitespace normalization for a configured base URL. */
export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}
