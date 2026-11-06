import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { cookieOptionsFor, hubEnv, type HubEnv } from "./config.js";

/**
 * Supabase client for server components, route handlers and server actions,
 * on the shared sign-in. Queries run as the signed-in person, so row-level
 * security applies.
 */
export async function createHubServerClient(env?: Partial<HubEnv>) {
  const { url, anonKey } = hubEnv(env);
  const store = await cookies();
  const h = await headers();
  return createServerClient(url, anonKey, {
    cookieOptions: cookieOptionsFor(h.get("x-forwarded-host") ?? h.get("host")),
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a server component, which can't set cookies. The
          // middleware refreshes the session on the next request instead.
        }
      },
    },
  });
}

export type HubViewer = {
  /** The signed-in person's email (lowercase), or null when signed out. */
  email: string | null;
  /** Their display name from the apps people table, when set. */
  name: string | null;
  /** Whether they may use this app. Always false when signed out. */
  hasAccess: boolean;
  /** Whether they are an apps admin. */
  isAdmin: boolean;
};

/**
 * Who is looking, for headers and greetings. The middleware already blocks
 * people without access; use this for display, and for an extra check in
 * route handlers that do sensitive work.
 */
export async function getHubViewer(appKey: string, env?: Partial<HubEnv>): Promise<HubViewer> {
  const supabase = await createHubServerClient(env);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { email: null, name: null, hasAccess: false, isAdmin: false };
  const email = user.email.toLowerCase();
  const [access, admin, person] = await Promise.all([
    supabase.rpc("hub_has_access", { p_key: appKey }),
    supabase.rpc("hub_is_admin"),
    supabase.from("hub_people").select("display_name").eq("email", email).maybeSingle(),
  ]);
  return {
    email,
    name: (person.data?.display_name as string | null | undefined) ?? null,
    hasAccess: access.data === true,
    isAdmin: admin.data === true,
  };
}
