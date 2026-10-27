import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "./session";

/** Read and verify the current session from the request cookies. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Ensure an authenticated session for pages/actions that must not be public.
 * Redirects to the login page otherwise.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Check credentials against the users table and set the session cookie. */
export async function login(
  username: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username.trim()))
    .limit(1);

  // Same error for unknown user and wrong password, no time-based leak.
  if (!user) {
    return { ok: false, error: "Identifiants incorrects." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { ok: false, error: "Identifiants incorrects." };
  }

  const token = await createSessionToken({
    userId: user.id,
    username: user.username,
  });

  (await cookies()).set(SESSION_COOKIE_NAME, token, sessionCookieOptions());

  return { ok: true };
}

/** Delete the session cookie. */
export async function logout() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}
