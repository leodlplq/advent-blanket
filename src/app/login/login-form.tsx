"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "./actions";

function PendingButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Connexion en cours…" : "Se connecter"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">🎄 Advent Blanket</CardTitle>
        <CardDescription>
          Connectez-vous pour gérer les calendriers de l&apos;Avent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Nom d&apos;utilisateur</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoFocus
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <PendingButton />
        </form>
      </CardContent>
    </Card>
  );
}
