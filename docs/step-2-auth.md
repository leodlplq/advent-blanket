# Step 2 — Authentication ✅ done

Commit: `781e48d`.

## Architecture

Two layers, kept apart so the proxy stays edge-safe:

- `src/lib/session.ts` — **pure JWT logic (jose), no Node-only imports**. Cookie name `advent_session`, HS256, 30-day expiry. Secret from `SESSION_SECRET` (dev fallback constant + production warning). Exports: `createSessionToken`, `verifySessionToken`, `sessionCookieOptions`, `SESSION_COOKIE_NAME`, `SessionPayload { userId, username }`.
- `src/lib/auth.ts` — server-side orchestration with DB (better-sqlite3) + cookies: `getSession()`, `requireSession()` (redirects to `/login`), `login()` (bcrypt compare against `users`, same error message for unknown user vs wrong password, sets httpOnly `Secure`-in-prod cookie), `logout()` (deletes cookie).

## Routes

- `/login` — server page (`src/app/login/page.tsx`) redirects logged-in users to `/admin`; renders `login-form.tsx` (client, `useActionState`). Server action `src/app/login/actions.ts` validates inputs (French error copy), calls `login`, redirects to `/admin`.
- `/admin` — `src/app/admin/layout.tsx` calls `requireSession()`, renders header (🎄 Advent Blanket, "Connecté : {username}", logout button wired to `logoutAction` in `src/app/admin/actions.ts`). `src/app/admin/page.tsx` = dashboard stub listing participants with "x/25 jours configurés" (counts via `count()` groupBy on `calendar_days`).

## Route protection — `src/proxy.ts`

Next 16 renamed middleware → **proxy** (default export named `proxy`). Matcher `["/admin/:path*", "/login"]`:
- `/admin/*` without valid JWT → redirect `/login`
- `/login` with valid JWT → redirect `/admin`

Only verifies the JWT (no DB) → compatible with edge runtime.

## Testing notes (verified)

- `/admin` anon → 307 `/login`; fake token → 307 `/login`; valid cookie → 200 showing "Connecté : admin" + Clémence/Léo cards; `/login` authed → 307 `/admin`.
- Production build statically prerenders `/` and shows Proxy (Middleware) in the route table.
- To forge a test cookie in Node: `new SignJWT({username}).setProtectedHeader({alg:"HS256"}).setSubject("1").setIssuedAt().setExpirationTime("30d").sign(secret)`.

## Deployment requirements

- **`SESSION_SECRET` must be set in production** (openssl rand -hex 32). Documented in `.env.example` (committed; `.env*` gitignored except the example).
