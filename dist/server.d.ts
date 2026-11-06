import { type HubEnv } from "./config.js";
/**
 * Supabase client for server components, route handlers and server actions,
 * on the shared sign-in. Queries run as the signed-in person, so row-level
 * security applies.
 */
export declare function createHubServerClient(env?: Partial<HubEnv>): Promise<import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>>;
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
export declare function getHubViewer(appKey: string, env?: Partial<HubEnv>): Promise<HubViewer>;
