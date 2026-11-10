"use client";

import { createBrowserClient } from "@supabase/ssr";
import { cookieOptionsFor, hubEnv, hubLoginUrl, type HubEnv } from "./config.js";

/**
 * Supabase client for client components, already on the shared sign-in.
 * Use it for every browser-side Supabase call in the app.
 */
export function createHubBrowserClient(env?: Partial<HubEnv>) {
  const { url, anonKey } = hubEnv({
    url: env?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return createBrowserClient(url, anonKey, {
    cookieOptions: cookieOptionsFor(window.location.hostname),
  });
}

/**
 * Signs the person out of every Agilitas app in this browser (they share one
 * sign-in cookie) and sends them to the apps sign-in. Their other devices stay
 * signed in. Off the shared domain (localhost, previews) it goes to
 * `localFallback` instead.
 */
export async function signOutEverywhere(localFallback = "/") {
  // scope "local": the default ("global") would also end the person's
  // sessions on every other device.
  await createHubBrowserClient().auth.signOut({ scope: "local" });
  const shared = cookieOptionsFor(window.location.hostname) !== undefined;
  window.location.assign(shared ? hubLoginUrl() : localFallback);
}
