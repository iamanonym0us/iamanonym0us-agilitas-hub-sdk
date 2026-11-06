import { type HubEnv } from "./config.js";
/**
 * Supabase client for client components, already on the shared sign-in.
 * Use it for every browser-side Supabase call in the app.
 */
export declare function createHubBrowserClient(env?: Partial<HubEnv>): import("@supabase/supabase-js").SupabaseClient<any, "public", "public", any, any>;
/**
 * Signs the person out of every Agilitas app and sends them to the apps sign-in.
 * Off the shared domain (localhost, previews) it goes to `localFallback` instead.
 */
export declare function signOutEverywhere(localFallback?: string): Promise<void>;
