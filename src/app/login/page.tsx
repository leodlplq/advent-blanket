import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Connexion — Advent Blanket",
};

export default async function LoginPage() {
  // Belt and braces: the proxy already handles this redirect.
  const session = await getSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
