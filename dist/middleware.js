import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { assertAppKey, cookieOptionsFor, hubEnv, hubLoginUrl } from "./config.js";
const matches = (list, path) => list.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : p + "/"));
/**
 * The full check, for apps that want to add their own logic afterwards:
 *   const hub = await checkHub(request, { appKey: "ops-tracker" });
 *   if (hub.stop) return hub.stop;
 *   ...your rules, using hub.user / hub.supabase...
 *   return hub.response;
 */
export async function checkHub(request, opts) {
    assertAppKey(opts.appKey);
    const { url, anonKey } = hubEnv(opts.env);
    const noAccessPath = opts.noAccessPath ?? "/no-access";
    const devLoginPath = opts.devLoginPath ?? "/login";
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const shared = cookieOptionsFor(host) !== undefined;
    let response = NextResponse.next({ request });
    const supabase = createServerClient(url, anonKey, {
        cookieOptions: cookieOptionsFor(host),
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll(list) {
                list.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });
    // getUser() checks the session with Supabase instead of trusting the cookie.
    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;
    const isApi = path.startsWith("/api/");
    // Any redirect must carry a session Supabase just refreshed, or the new
    // refresh token is lost and people get signed out of every app.
    const keep = (res) => {
        response.cookies.getAll().forEach((c) => res.cookies.set(c));
        return res;
    };
    const done = (stop, allowed) => ({
        response,
        user,
        supabase: supabase,
        allowed,
        stop,
    });
    if (matches(opts.publicPaths ?? [], path) || (!shared && matches([devLoginPath], path))) {
        return done(null, false);
    }
    if (!user) {
        if (isApi)
            return done(keep(NextResponse.json({ error: "Not signed in" }, { status: 401 })), false);
        if (shared) {
            const back = `https://${host}${path}${request.nextUrl.search}`;
            return done(keep(NextResponse.redirect(hubLoginUrl(back))), false);
        }
        const login = request.nextUrl.clone();
        login.pathname = devLoginPath;
        login.search = path === "/" ? "" : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
        return done(keep(NextResponse.redirect(login)), false);
    }
    if (matches([noAccessPath], path))
        return done(null, false);
    const { data, error } = await supabase.rpc("hub_has_access", { p_key: opts.appKey });
    if (error)
        console.error(`[hub-sdk] access check for "${opts.appKey}" failed:`, error.message);
    const allowed = data === true; // an error counts as no access
    if (!allowed) {
        if (isApi)
            return done(keep(NextResponse.json({ error: "No access to this app" }, { status: 403 })), false);
        const to = request.nextUrl.clone();
        to.pathname = noAccessPath;
        to.search = "";
        return done(keep(NextResponse.redirect(to)), false);
    }
    return done(null, true);
}
/**
 * Ready-made middleware. In middleware.ts (Next 15) or proxy.ts (Next 16):
 *   export const middleware = hubMiddleware({ appKey: "ops-tracker" });   // Next 15
 *   export const proxy = hubMiddleware({ appKey: "ops-tracker" });        // Next 16
 */
export function hubMiddleware(opts) {
    assertAppKey(opts.appKey);
    return async function agilitasHub(request) {
        const hub = await checkHub(request, opts);
        return hub.stop ?? hub.response;
    };
}
