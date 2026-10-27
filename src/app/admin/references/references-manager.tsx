"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { EllipsisVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  createStitchAction,
  createYarnAction,
  deleteStitchAction,
  deleteYarnAction,
  updateStitchAction,
  updateYarnAction,
  type ReferenceActionState,
} from "./actions";

/**
 * Tabs over the two reusable lists (stitches / yarns) with add, edit and
 * delete dialogs. Deletion is warned about when days reference the entry.
 */

export interface StitchRowData {
  id: number;
  name: string;
  fixedRows: number | null;
  usage: number;
}

export interface YarnRowData {
  id: number;
  name: string;
  colorHex: string;
  usage: number;
}

const emptyState: ReferenceActionState = {};

// --- Submit buttons ---------------------------------------------------------

function SubmitPendingButton({
  label,
  pendingLabel,
  variant = "default",
}: {
  label: string;
  pendingLabel: string;
  variant?: "default" | "destructive";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function useCloseOnSuccess(
  success: boolean | undefined,
  onClose: () => void,
  message: string,
) {
  useEffect(() => {
    if (success) {
      onClose();
      toast.success(message);
    }
  }, [success, onClose, message]);
}

// --- Main component ---------------------------------------------------------

export function ReferencesManager({
  stitches,
  yarns,
}: {
  stitches: StitchRowData[];
  yarns: YarnRowData[];
}) {
  const [tab, setTab] = useState<"stitches" | "yarns">("stitches");

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border p-1">
          <TabButton active={tab === "stitches"} onClick={() => setTab("stitches")}>
            Points ({stitches.length})
          </TabButton>
          <TabButton active={tab === "yarns"} onClick={() => setTab("yarns")}>
            Pelottes ({yarns.length})
          </TabButton>
        </div>
      </div>

      {tab === "stitches" ? (
        <StitchesTab stitches={stitches} />
      ) : (
        <YarnsTab yarns={yarns} />
      )}

      <Toaster position="bottom-right" />
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// --- Stitches tab -----------------------------------------------------------

function StitchesTab({ stitches }: { stitches: StitchRowData[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StitchRowData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StitchRowData | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Les jours sont proposés entre 2 et 5 rangs, sauf rangs imposés.
        </p>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus aria-hidden /> Ajouter un point
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Rangs</TableHead>
              <TableHead>Jours liés</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stitches.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Aucun point pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              stitches.map((stitch) => (
                <TableRow key={stitch.id}>
                  <TableCell className="font-medium">{stitch.name}</TableCell>
                  <TableCell>
                    {stitch.fixedRows != null ? (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {stitch.fixedRows} rangs imposés
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">2–5 (libre)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {stitch.usage === 0 ? "—" : `${stitch.usage}`}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions pour le point ${stitch.name}`}
                        >
                          <EllipsisVertical aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(stitch)}>
                          <Pencil aria-hidden /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(stitch)}
                        >
                          <Trash2 aria-hidden /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StitchFormDialog
        mode="create"
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      <StitchFormDialog
        mode="edit"
        stitch={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteStitchDialog
        stitch={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

// --- Stitch form (create + edit share one dialog) -----------------------------

function StitchFormDialog({
  mode,
  open,
  onOpenChange,
  stitch,
  onClose,
}: {
  mode: "create" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  stitch?: StitchRowData | null;
  onClose?: () => void;
}) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateStitchAction : createStitchAction;
  const [state, formAction] = useActionState(action, emptyState);

  const openControlled = isEdit ? stitch != null : (open ?? false);
  const handleOpenChange = isEdit
    ? (o: boolean) => !o && onClose?.()
    : onOpenChange;
  const close = isEdit ? onClose ?? (() => {}) : () => onOpenChange?.(false);
  useCloseOnSuccess(state.ok, close, isEdit ? "Point modifié." : "Point ajouté.");

  return (
    <Dialog open={openControlled} onOpenChange={handleOpenChange}>
      {(openControlled && (isEdit ? stitch : true)) ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier le point" : "Ajouter un point"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Les jours déjà configurés ne sont pas modifiés."
                : "Il apparaîtra dans le choix des jours, pour tous les calendriers."}
            </DialogDescription>
          </DialogHeader>
          <form
            key={stitch?.id ?? "create"}
            action={formAction}
            className="grid gap-4"
          >
            {isEdit && stitch ? (
              <input type="hidden" name="id" value={stitch.id} />
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="stitch-name">Nom</Label>
              <Input
                id="stitch-name"
                name="name"
                defaultValue={stitch?.name}
                placeholder="Ex. Maille serrée"
                autoFocus
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stitch-fixed-rows">Rangs imposés</Label>
              <Input
                id="stitch-fixed-rows"
                name="fixedRows"
                type="number"
                inputMode="numeric"
                min={2}
                max={5}
                defaultValue={stitch?.fixedRows ?? ""}
                placeholder="2 à 5"
              />
              <p className="text-xs text-muted-foreground">
                Laisser vide pour laisser le choix entre 2 et 5 rangs.
              </p>
            </div>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <SubmitPendingButton
                label={isEdit ? "Enregistrer" : "Ajouter"}
                pendingLabel="Enregistrement…"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

// --- Delete stitch ----------------------------------------------------------

function DeleteStitchDialog({
  stitch,
  onClose,
}: {
  stitch: StitchRowData | null;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(deleteStitchAction, emptyState);
  useCloseOnSuccess(state.ok, onClose, "Point supprimé.");

  return (
    <Dialog open={stitch !== null} onOpenChange={(open) => !open && onClose()}>
      {stitch ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer {stitch.name} ?</DialogTitle>
            <DialogDescription>
              {stitch.usage === 0
                ? "Aucun jour ne l'utilise. Cette action est définitive."
                : `${stitch.usage} jour(s) utilisent ce point ; ils resteront configurés sans point. Cette action est définitive.`}
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={stitch.id} />
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <SubmitPendingButton
                label="Supprimer"
                pendingLabel="Suppression en cours…"
                variant="destructive"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

// --- Yarns tab --------------------------------------------------------------

function YarnsTab({ yarns }: { yarns: YarnRowData[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<YarnRowData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<YarnRowData | null>(null);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          La couleur s&apos;affiche à côté du nom, dans chaque calendrier.
        </p>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus aria-hidden /> Ajouter une pelotte
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Couleur</TableHead>
              <TableHead>Jours liés</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {yarns.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  Aucune pelotte pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              yarns.map((yarn) => (
                <TableRow key={yarn.id}>
                  <TableCell className="font-medium">{yarn.name}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2 text-xs">
                      <span
                        className="size-3.5 shrink-0 rounded-full ring-1 ring-foreground/20"
                        style={{ backgroundColor: yarn.colorHex }}
                        aria-hidden
                      />
                      <span className="font-mono text-muted-foreground">
                        {yarn.colorHex}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {yarn.usage === 0 ? "—" : `${yarn.usage}`}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions pour la pelotte ${yarn.name}`}
                        >
                          <EllipsisVertical aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(yarn)}>
                          <Pencil aria-hidden /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(yarn)}
                        >
                          <Trash2 aria-hidden /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <YarnFormDialog mode="create" open={addOpen} onOpenChange={setAddOpen} />
      <YarnFormDialog mode="edit" yarn={editTarget} onClose={() => setEditTarget(null)} />
      <DeleteYarnDialog yarn={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}

// --- Yarn form (create + edit share one dialog) -------------------------------

function YarnFormDialog({
  mode,
  open,
  onOpenChange,
  yarn,
  onClose,
}: {
  mode: "create" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  yarn?: YarnRowData | null;
  onClose?: () => void;
}) {
  const isEdit = mode === "edit";
  const action = isEdit ? updateYarnAction : createYarnAction;
  const [state, formAction] = useActionState(action, emptyState);

  // Color input and hex text stay in sync; the hidden field carries the value.
  // The picker is keyed so its state resets whenever a different yarn is
  // opened (or the create dialog is reopened) — no effect needed.
  const pickerKey = isEdit ? `edit-${yarn?.id}` : `create-${open}`;

  const openControlled = isEdit ? yarn != null : (open ?? false);
  const handleOpenChange = isEdit
    ? (o: boolean) => !o && onClose?.()
    : onOpenChange;
  const close = isEdit ? onClose ?? (() => {}) : () => onOpenChange?.(false);
  useCloseOnSuccess(
    state.ok,
    close,
    isEdit ? "Pelotte modifiée." : "Pelotte ajoutée.",
  );

  return (
    <Dialog open={openControlled} onOpenChange={handleOpenChange}>
      {(openControlled && (isEdit ? yarn : true)) ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier la pelotte" : "Ajouter une pelotte"}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Les jours déjà configurés ne sont pas modifiés."
                : "Elle apparaîtra dans le choix des jours, pour tous les calendriers."}
            </DialogDescription>
          </DialogHeader>
          <form
            key={yarn?.id ?? "create"}
            action={formAction}
            className="grid gap-4"
          >
            {isEdit && yarn ? (
              <input type="hidden" name="id" value={yarn.id} />
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="yarn-name">Nom</Label>
              <Input
                id="yarn-name"
                name="name"
                defaultValue={yarn?.name}
                placeholder="Ex. Rose pâle"
                autoFocus
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yarn-color-text">Couleur</Label>
              <ColorPickerField key={pickerKey} initial={isEdit ? yarn?.colorHex : null} />
            </div>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <SubmitPendingButton
                label={isEdit ? "Enregistrer" : "Ajouter"}
                pendingLabel="Enregistrement…"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

// --- Shared color picker (native palette + hex text, hidden field posts it) ---

function ColorPickerField({ initial }: { initial?: string | null }) {
  const start = initial ?? "#cccccc";
  const [color, setColor] = useState(start);
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : start;

  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name="colorHex" value={safeColor} />
      {/* Native color picker: opens the system palette. */}
      <input
        type="color"
        aria-label="Choisir la couleur"
        value={safeColor}
        onChange={(event) => setColor(event.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
      />
      <Input
        aria-label="Code hexadécimal de la couleur"
        value={color}
        onChange={(event) => setColor(event.target.value)}
        placeholder="#cccccc"
        className="font-mono"
      />
    </div>
  );
}

// --- Delete yarn ------------------------------------------------------------

function DeleteYarnDialog({
  yarn,
  onClose,
}: {
  yarn: YarnRowData | null;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(deleteYarnAction, emptyState);
  useCloseOnSuccess(state.ok, onClose, "Pelotte supprimée.");

  return (
    <Dialog open={yarn !== null} onOpenChange={(open) => !open && onClose()}>
      {yarn ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer {yarn.name} ?</DialogTitle>
            <DialogDescription>
              {yarn.usage === 0
                ? "Aucun jour ne l'utilise. Cette action est définitive."
                : `${yarn.usage} jour(s) utilisent cette pelotte ; ils resteront configurés sans pelotte. Cette action est définitive.`}
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={yarn.id} />
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <SubmitPendingButton
                label="Supprimer"
                pendingLabel="Suppression en cours…"
                variant="destructive"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
