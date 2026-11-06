import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { type HubEnv } from "./config.js";
export type HubMiddlewareOptions = {
    /** The app's key, exactly as registered on the apps admin page. */
    appKey: string;
    /** Paths anyone may open without signing in (prefix match), e.g. ["/health", "/api/webhook"]. */
    publicPaths?: string[];
    /** Page shown to signed-in people without access. Default "/no-access". */
    noAccessPath?: string;
    /**
     * Sign-in page used off the shared domain (localhost, *.vercel.app previews),
     * where the apps sign-in can't hand over a session. Default "/login".
     * Mount <HubDevSignIn /> there. On the real subdomain it is never used.
     */
    devLoginPath?: string;
    /** Supabase URL + public key, if not in the NEXT_PUBLIC_ variables. */
    env?: Partial<HubEnv>;
};
export type HubCheck = {
    /** Continue with this response (it carries any refreshed session cookies). */
    response: NextResponse;
    user: User | null;
    supabase: SupabaseClient;
    /** Signed in and allowed into this app. */
    allowed: boolean;
    /** Set when the request must not go on: return it as is. */
    stop: NextResponse | null;
};
/**
 * The full check, for apps that want to add their own logic afterwards:
 *   const hub = await checkHub(request, { appKey: "ops-tracker" });
 *   if (hub.stop) return hub.stop;
 *   ...your rules, using hub.user / hub.supabase...
 *   return hub.response;
 */
export declare function checkHub(request: NextRequest, opts: HubMiddlewareOptions): Promise<HubCheck>;
/**
 * Ready-made middleware. In middleware.ts (Next 15) or proxy.ts (Next 16):
 *   export const middleware = hubMiddleware({ appKey: "ops-tracker" });   // Next 15
 *   export const proxy = hubMiddleware({ appKey: "ops-tracker" });        // Next 16
 */
export declare function hubMiddleware(opts: HubMiddlewareOptions): (request: NextRequest) => Promise<NextResponse<unknown>>;
