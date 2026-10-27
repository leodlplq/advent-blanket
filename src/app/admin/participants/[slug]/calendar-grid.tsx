"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { clearDayAction, saveDayAction, type DayActionState } from "../days";

/**
 * 25-day calendar grid for one participant, with a day editor dialog.
 * The rows field is locked when the selected stitch imposes `fixed_rows`.
 */

export interface StitchOption {
  id: number;
  name: string;
  fixedRows: number | null;
}

export interface YarnOption {
  id: number;
  name: string;
  colorHex: string;
}

export interface CalendarDayData {
  day: number;
  configured: boolean;
  stitchId: number | null;
  yarnId: number | null;
  rows: number | null;
  tutoUrl: string | null;
  notes: string | null;
}

const initialDayState: DayActionState = {};

// --- Grid ---------------------------------------------------------------------

export function CalendarGrid({
  participantId,
  participantName,
  days,
  stitches,
  yarns,
}: {
  participantId: number;
  participantName: string;
  days: CalendarDayData[];
  stitches: StitchOption[];
  yarns: YarnOption[];
}) {
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {days.map((cell) => (
          <DayCellTile
            key={cell.day}
            cell={cell}
            stitchName={
              cell.stitchId != null
                ? stitches.find((s) => s.id === cell.stitchId)?.name ?? null
                : null
            }
            yarn={
              cell.yarnId != null
                ? yarns.find((y) => y.id === cell.yarnId) ?? null
                : null
            }
            onOpen={() => setSelectedDay(cell)}
          />
        ))}
      </div>

      {/* key={day} remounts the editor so form + action state reset per day. */}
      {selectedDay ? (
        <DayEditorDialog
          key={selectedDay.day}
          participantId={participantId}
          participantName={participantName}
          cell={selectedDay}
          stitches={stitches}
          yarns={yarns}
          onClose={() => setSelectedDay(null)}
        />
      ) : null}

      <Toaster position="bottom-right" />
    </>
  );
}

function DayCellTile({
  cell,
  stitchName,
  yarn,
  onOpen,
}: {
  cell: CalendarDayData;
  stitchName: string | null;
  yarn: YarnOption | null;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Jour ${cell.day} — ${cell.configured ? "configuré" : "vide"}. Modifier.`}
      className={cn(
        "rounded-lg border p-2.5 text-left transition-colors",
        cell.configured
          ? "border-border bg-card hover:border-ring/50 hover:bg-accent/50"
          : "border-dashed bg-transparent text-muted-foreground hover:bg-accent/30",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
          Jour {cell.day}
        </span>
        {cell.configured ? (
          <Check className="size-3 text-primary" aria-hidden />
        ) : null}
      </div>
      <div
        className={cn(
          "mt-1 truncate text-sm font-medium",
          !cell.configured && "font-normal",
        )}
      >
        {stitchName ?? "—"}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {yarn ? (
          <span
            className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
            style={{ backgroundColor: yarn.colorHex }}
            aria-hidden
          />
        ) : null}
        <span className="truncate">
          {yarn ? yarn.name : "—"}
          {cell.rows != null ? ` · ${cell.rows} rangs` : ""}
        </span>
      </div>
    </button>
  );
}

// --- Day editor dialog ----------------------------------------------------------

function DayEditorDialog({
  participantId,
  participantName,
  cell,
  stitches,
  yarns,
  onClose,
}: {
  participantId: number;
  participantName: string;
  cell: CalendarDayData;
  stitches: StitchOption[];
  yarns: YarnOption[];
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(saveDayAction, initialDayState);
  const [isClearPending, startClearTransition] = useTransition();

  const [stitchId, setStitchId] = useState<number | null>(cell.stitchId);
  const [yarnId, setYarnId] = useState<number | null>(cell.yarnId);
  const [rows, setRows] = useState<string>(
    cell.rows != null ? String(cell.rows) : "",
  );

  const selectedStitch =
    stitchId != null ? stitches.find((s) => s.id === stitchId) ?? null : null;
  const fixedRows = selectedStitch?.fixedRows ?? null;

  // Lock the value to the stitch-imposed one as soon as a fixed stitch is selected.
  useEffect(() => {
    if (fixedRows != null) {
      setRows(String(fixedRows));
    }
  }, [fixedRows]);

  // Close + toast once the save action reports success.
  useEffect(() => {
    if (state.ok) {
      onClose();
      toast.success(`Jour ${cell.day} enregistré.`);
    }
  }, [state.ok, onClose, cell.day]);

  const handleClear = () => {
    startClearTransition(async () => {
      const result = await clearDayAction(participantId, cell.day);
      if (result.ok) {
        onClose();
        toast.success(`Jour ${cell.day} vidé.`);
      } else {
        toast.error(result.error ?? "Échec de la suppression.");
      }
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Jour {cell.day} — {participantName}
          </DialogTitle>
          <DialogDescription>
            {cell.configured
              ? "Modifiez ou videz ce jour."
              : "Choisissez le point, la pelotte et le nombre de rangs."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="participantId" value={participantId} />
          <input type="hidden" name="day" value={cell.day} />

          {/* Point -------------------------------------------------------- */}
          <div className="grid gap-2">
            <Label htmlFor="stitch">Point</Label>
            <Select
              name="stitchId"
              value={stitchId != null ? String(stitchId) : ""}
              onValueChange={(value) => setStitchId(Number(value))}
            >
              <SelectTrigger id="stitch" className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {stitches.map((stitch) => (
                  <SelectItem key={stitch.id} value={String(stitch.id)}>
                    {stitch.name}
                    {stitch.fixedRows != null
                      ? ` (${stitch.fixedRows} rangs imposés)`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pelotte ------------------------------------------------------ */}
          <div className="grid gap-2">
            <Label htmlFor="yarn">Pelotte</Label>
            <Select
              name="yarnId"
              value={yarnId != null ? String(yarnId) : ""}
              onValueChange={(value) => setYarnId(Number(value))}
            >
              <SelectTrigger id="yarn" className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {yarns.map((yarn) => (
                  <SelectItem key={yarn.id} value={String(yarn.id)}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-2.5 shrink-0 rounded-full ring-1 ring-foreground/20"
                        style={{ backgroundColor: yarn.colorHex }}
                        aria-hidden
                      />
                      {yarn.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rangs ------------------------------------------------------ */}
          <div className="grid gap-2">
            <Label htmlFor="rows">Nombre de rangs</Label>
            <Input
              id="rows"
              name="rows"
              type="number"
              inputMode="numeric"
              min={2}
              max={5}
              value={fixedRows != null ? String(fixedRows) : rows}
              onChange={(event) => setRows(event.target.value)}
              disabled={fixedRows != null}
            />
            {fixedRows != null ? (
              <p className="text-xs text-muted-foreground">
                Impose : {fixedRows} rangs ({selectedStitch?.name}).
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Entre 2 et 5 rangs.
              </p>
            )}
          </div>

          {/* Lien du tuto ------------------------------------------------- */}
          <div className="grid gap-2">
            <Label htmlFor="tutoUrl">Lien du tuto</Label>
            <Input
              id="tutoUrl"
              name="tutoUrl"
              type="url"
              defaultValue={cell.tutoUrl ?? ""}
              placeholder="https://…"
            />
          </div>

          {/* Notes -------------------------------------------------------- */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={cell.notes ?? ""}
              rows={3}
              placeholder="Astuces, photos, détails de montage…"
            />
            <p className="text-xs text-muted-foreground">
              Texte simple (markdown léger) affiché sur la page publique.
            </p>
          </div>

          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            {cell.configured ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleClear}
                disabled={isClearPending}
              >
                {isClearPending ? "Suppression…" : "Vider le jour"}
              </Button>
            ) : null}
            <SaveButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Enregistrement…" : "Enregistrer"}
    </Button>
  );
}
