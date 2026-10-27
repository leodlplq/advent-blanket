import { redirect } from "next/navigation";

/**
 * The backoffice is the app's main surface — `/` simply funnels into it.
 * Unauthenticated visitors chained through the proxy: / → /admin → /login.
 */
export default function HomePage() {
  redirect("/admin");
}
