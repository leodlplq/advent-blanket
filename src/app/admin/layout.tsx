import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { logoutAction } from "./actions";

export const metadata = {
  title: "Backoffice — Advent Blanket",
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between p-4">
          <span className="text-lg font-semibold">🎄 Advent Blanket</span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              Connecté :{" "}
              <strong className="font-medium text-foreground">
                {session.username}
              </strong>
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                Se déconnecter
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 p-4">
        {children}
      </main>
    </div>
  );
}
