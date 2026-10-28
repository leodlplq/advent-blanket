"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";
import { Check, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { quickCreateStitchAction, quickCreateYarnAction } from "../../references/actions";

/**
 * 24-day calendar grid for one participant, with a day editor dialog.
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
  participantSlug,
  days,
  stitches,
  yarns,
}: {
  participantId: number;
  participantName: string;
  participantSlug: string;
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
            participantSlug={participantSlug}
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
          participantSlug={participantSlug}
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
  participantSlug,
  stitchName,
  yarn,
  onOpen,
}: {
  cell: CalendarDayData;
  participantSlug: string;
  stitchName: string | null;
  yarn: YarnOption | null;
  onOpen: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Jour ${cell.day} — ${cell.configured ? "configuré" : "vide"}. Modifier.`}
        className={cn(
          "w-full rounded-lg border p-2.5 text-left transition-colors",
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
      {cell.configured ? (
        <a
          href={`/cal/${participantSlug}/${cell.day}`}
          target="_blank"
          rel="noopener"
          aria-label={`Aperçu public du jour ${cell.day} (nouvel onglet)`}
          className="absolute right-1 bottom-1 z-10 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
        >
          <Eye className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

// --- Day editor dialog ----------------------------------------------------------

function DayEditorDialog({
  participantId,
  participantName,
  participantSlug,
  cell,
  stitches,
  yarns,
  onClose,
}: {
  participantId: number;
  participantName: string;
  participantSlug: string;
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

  // Local copies of the reference lists: quick-created entities are appended
  // here (and auto-selected) without closing the day editor.
  const [stitchList, setStitchList] = useState(stitches);
  const [yarnList, setYarnList] = useState(yarns);

  const handleStitchCreated = (option: StitchOption) => {
    setStitchList((list) =>
      list.some((item) => item.id === option.id)
        ? list
        : [...list, option].sort((a, b) =>
            a.name.localeCompare(b.name, "fr"),
          ),
    );
    setStitchId(option.id);
  };

  const handleYarnCreated = (option: YarnOption) => {
    setYarnList((list) =>
      list.some((item) => item.id === option.id)
        ? list
        : [...list, option].sort((a, b) =>
            a.name.localeCompare(b.name, "fr"),
          ),
    );
    setYarnId(option.id);
  };

  const selectedStitch =
    stitchId != null ? stitchList.find((s) => s.id === stitchId) ?? null : null;
  const fixedRows = selectedStitch?.fixedRows ?? null;

  // The rows lock works purely through the value prop: when the stitch
  // imposes fixed_rows the input is disabled and displays that value, so
  // nothing is submitted from stale local state.

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
            <div className="flex items-center justify-between">
              <Label htmlFor="stitch">Point</Label>
              <QuickCreateStitchDialog onCreated={handleStitchCreated} />
            </div>
            <Select
              name="stitchId"
              value={stitchId != null ? String(stitchId) : ""}
              onValueChange={(value) => setStitchId(Number(value))}
            >
              <SelectTrigger id="stitch" className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {stitchList.map((stitch) => (
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
            <div className="flex items-center justify-between">
              <Label htmlFor="yarn">Pelotte</Label>
              <QuickCreateYarnDialog onCreated={handleYarnCreated} />
            </div>
            <Select
              name="yarnId"
              value={yarnId != null ? String(yarnId) : ""}
              onValueChange={(value) => setYarnId(Number(value))}
            >
              <SelectTrigger id="yarn" className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {yarnList.map((yarn) => (
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
            <a
              href={`/cal/${participantSlug}/${cell.day}`}
              target="_blank"
              rel="noopener"
              className="mr-auto inline-flex items-center gap-1.5 self-center rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Eye className="size-4" aria-hidden /> Aperçu public
            </a>
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

// --- Quick-create dialogs ------------------------------------------------------
// Small nested dialogs spawning from the day editor. On success the new
// option is handed back (complete: name + fixedRows / colorHex) and
// auto-selected; the day editor stays open.

function QuickCreateStitchDialog({
  onCreated,
}: {
  onCreated: (option: StitchOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [fixedRows, setFixedRows] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") ?? "").trim();
    const rows = fixedRows.trim() === "" ? null : Number(fixedRows);

    startTransition(async () => {
      const result = await quickCreateStitchAction(name, rows);
      if (result.ok && result.id != null) {
        onCreated({ id: result.id, name, fixedRows: rows });
        setOpen(false);
        setFixedRows("");
        toast.success(`Point « ${name} » ajouté et sélectionné.`);
      } else {
        toast.error(result.error ?? "Échec de la création.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Plus aria-hidden /> Nouveau
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouveau point</DialogTitle>
          <DialogDescription>
            Il sera ajouté à la liste pour tous les calendriers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="quick-stitch-name">Nom</Label>
            <Input
              id="quick-stitch-name"
              name="name"
              autoFocus
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quick-stitch-rows">Rangs imposés</Label>
            <Input
              id="quick-stitch-rows"
              type="number"
              inputMode="numeric"
              min={2}
              max={5}
              value={fixedRows}
              onChange={(event) => setFixedRows(event.target.value)}
              placeholder="2 à 5"
            />
            <p className="text-xs text-muted-foreground">
              Laisser vide pour laisser le choix entre 2 et 5 rangs.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Ajout…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuickCreateYarnDialog({
  onCreated,
}: {
  onCreated: (option: YarnOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#cccccc");
  const [isPending, startTransition] = useTransition();

  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#cccccc";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();

    startTransition(async () => {
      const result = await quickCreateYarnAction(name, safeColor);
      if (result.ok && result.id != null) {
        onCreated({ id: result.id, name, colorHex: safeColor });
        setOpen(false);
        setColor("#cccccc");
        toast.success(`Pelotte « ${name} » ajoutée et sélectionnée.`);
      } else {
        toast.error(result.error ?? "Échec de la création.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <Plus aria-hidden /> Nouvelle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouvelle pelotte</DialogTitle>
          <DialogDescription>
            Elle sera ajoutée à la liste pour tous les calendriers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="quick-yarn-name">Nom</Label>
            <Input
              id="quick-yarn-name"
              name="name"
              autoFocus
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quick-yarn-color">Couleur</Label>
            <div className="flex items-center gap-2">
              <input
                id="quick-yarn-color"
                type="color"
                aria-label="Choisir la couleur"
                value={safeColor}
                onChange={(event) => setColor(event.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <span className="font-mono text-sm text-muted-foreground">
                {safeColor}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Ajout…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
