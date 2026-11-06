"use client";
import { createBrowserClient } from "@supabase/ssr";
import { cookieOptionsFor, hubEnv, hubLoginUrl } from "./config.js";
/**
 * Supabase client for client components, already on the shared sign-in.
 * Use it for every browser-side Supabase call in the app.
 */
export function createHubBrowserClient(env) {
    const { url, anonKey } = hubEnv({
        url: env?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: env?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
    return createBrowserClient(url, anonKey, {
        cookieOptions: cookieOptionsFor(window.location.hostname),
    });
}
/**
 * Signs the person out of every Agilitas app and sends them to the apps sign-in.
 * Off the shared domain (localhost, previews) it goes to `localFallback` instead.
 */
export async function signOutEverywhere(localFallback = "/") {
    await createHubBrowserClient().auth.signOut();
    const shared = cookieOptionsFor(window.location.hostname) !== undefined;
    window.location.assign(shared ? hubLoginUrl() : localFallback);
}
