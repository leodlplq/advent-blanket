"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { EllipsisVertical, FileDown, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  createParticipantAction,
  deleteParticipantAction,
  renameParticipantAction,
  type ParticipantActionState,
} from "./actions";

export interface ParticipantCardData {
  id: number;
  name: string;
  slug: string;
  dayCount: number;
}

const emptyState: ParticipantActionState = {};

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

// --- Main component ---------------------------------------------------------

export function ParticipantsManager({
  participants,
}: {
  participants: ParticipantCardData[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ParticipantCardData | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ParticipantCardData | null>(
    null,
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Sélectionnez une personne pour préparer ses 25 jours.
        </p>
        <Button onClick={() => setAddOpen(true)} size="sm">
          <Plus aria-hidden /> Ajouter une personne
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {participants.map((participant) => (
          <Card key={participant.id} className="relative">
            <CardHeader className="relative block pr-10">
              {/* Stretched link: whole card clickable, without nesting the
                  dropdown trigger in the anchor. */}
              <Link
                href={`/admin/participants/${participant.slug}`}
                className="absolute inset-0 rounded-lg"
                aria-label={`Calendrier de ${participant.name}`}
              />
              <CardTitle>{participant.name}</CardTitle>
              <CardDescription className="mt-1.5">
                {participant.dayCount}/25 jours configurés
              </CardDescription>
            </CardHeader>
            <div className="absolute top-3 right-3 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Actions pour ${participant.name}`}
                  >
                    <EllipsisVertical aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`/api/pdf/${participant.slug}`} download>
                      <FileDown aria-hidden /> Imprimer les QR codes
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRenameTarget(participant)}>
                    <Pencil aria-hidden /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(participant)}
                  >
                    <Trash2 aria-hidden /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        ))}
      </div>

      <AddParticipantDialog open={addOpen} onOpenChange={setAddOpen} />
      <RenameParticipantDialog
        participant={renameTarget}
        onClose={() => setRenameTarget(null)}
      />
      <DeleteParticipantDialog
        participant={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
      <Toaster position="bottom-right" />
    </>
  );
}

// --- Helpers ----------------------------------------------------------------

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

// --- Add dialog -------------------------------------------------------------

function AddParticipantDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    createParticipantAction,
    emptyState,
  );
  useCloseOnSuccess(state.ok, () => onOpenChange(false), "Participant ajouté.");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajouter une personne</DialogTitle>
          <DialogDescription>
            Un calendrier de 25 jours sera créé pour cette personne.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <NameField error={state.error} autoFocus />
          <DialogFooter>
            <SubmitPendingButton label="Ajouter" pendingLabel="Ajout en cours…" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Rename dialog ----------------------------------------------------------

function RenameParticipantDialog({
  participant,
  onClose,
}: {
  participant: ParticipantCardData | null;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(
    renameParticipantAction,
    emptyState,
  );
  useCloseOnSuccess(state.ok, onClose, "Nom modifié.");

  return (
    <Dialog open={participant !== null} onOpenChange={(open) => !open && onClose()}>
      {participant ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier le nom</DialogTitle>
            <DialogDescription>
              Le lien du calendrier ne change pas : les QR codes restent valables.
            </DialogDescription>
          </DialogHeader>
          <form
            key={participant.id}
            action={formAction}
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={participant.id} />
            <NameField
              error={state.error}
              defaultValue={participant.name}
              autoFocus
            />
            <DialogFooter>
              <SubmitPendingButton
                label="Enregistrer"
                pendingLabel="Modification en cours…"
              />
            </DialogFooter>
          </form>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

// --- Delete dialog ----------------------------------------------------------

function DeleteParticipantDialog({
  participant,
  onClose,
}: {
  participant: ParticipantCardData | null;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(
    deleteParticipantAction,
    emptyState,
  );
  useCloseOnSuccess(state.ok, onClose, "Participant supprimé.");

  return (
    <Dialog open={participant !== null} onOpenChange={(open) => !open && onClose()}>
      {participant ? (
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer {participant.name} ?</DialogTitle>
            <DialogDescription>
              Ses {participant.dayCount} jour(s) configuré(s) seront également
              supprimés. Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={participant.id} />
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

// --- Shared name field ------------------------------------------------------

function NameField({
  error,
  defaultValue,
  autoFocus,
}: {
  error?: string;
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="name">Nom</Label>
      <Input
        id="name"
        name="name"
        defaultValue={defaultValue}
        placeholder="Ex. Clémence"
        autoFocus={autoFocus}
        required
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
