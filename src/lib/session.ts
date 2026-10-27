import { SignJWT, jwtVerify } from "jose";

/**
 * JWT-based session utilities.
 *
 * Kept free of Node-only imports (no better-sqlite3) so it can be used
 * both in server components/actions and in the Proxy (edge runtime).
 */

export const SESSION_COOKIE_NAME = "advent_session";

// 30 days, trusting the shared backoffice is only used by the family.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionPayload {
  userId: number;
  username: string;
}

const DEV_FALLBACK_SECRET = "dev-only-secret-do-not-use-in-production";

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn(
      "[advent-blanket] SESSION_SECRET is not set: falling back to a development secret. Set SESSION_SECRET in your environment.",
    );
  }
  return new TextEncoder().encode(secret ?? DEV_FALLBACK_SECRET);
}

export async function createSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    if (!payload.sub) return null;
    return {
      userId: Number(payload.sub),
      username: typeof payload.username === "string" ? payload.username : "",
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
