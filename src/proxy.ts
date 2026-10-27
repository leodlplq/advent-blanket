import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Route protection:
 * - /admin/* requires a valid session, otherwise redirect to /login
 * - /login redirects to /admin if already authenticated
 *
 * Note: only verifies the signed JWT here (edge-safe), the database is
 * never touched in the proxy.
 */
export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
