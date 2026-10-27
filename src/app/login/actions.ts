"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return {
      error: "Veuillez renseigner votre nom d'utilisateur et votre mot de passe.",
    };
  }

  const result = await login(username, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/admin");
}
