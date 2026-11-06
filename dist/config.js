// Shared settings every Agilitas app must agree on. Changing any of these in
// one app splits it off from the others' sign-in, so they live here only.
export const HUB_URL = "https://apps.agilitasenergysolutions.com";
export const SHARED_DOMAIN = "agilitasenergysolutions.com";
export const SHARED_COOKIE_NAME = "sb-agilitas-auth";
export const SUPPORT_EMAIL = "ssuresh@agilitasenergy.com";
/**
 * Cookie settings for the Supabase session.
 * On *.agilitasenergysolutions.com: one cookie for the parent domain, shared
 * by every Agilitas app. Anywhere else (localhost, *.vercel.app previews):
 * undefined, i.e. Supabase's default cookie for this host only.
 */
export function cookieOptionsFor(host) {
    const h = (host ?? "").split(":")[0].toLowerCase();
    if (h === SHARED_DOMAIN || h.endsWith("." + SHARED_DOMAIN)) {
        return {
            name: SHARED_COOKIE_NAME,
            domain: "." + SHARED_DOMAIN,
            path: "/",
            sameSite: "lax",
            secure: true,
        };
    }
    return undefined;
}
/** True when the shared sign-in can work on this host. */
export function isSharedHost(host) {
    return cookieOptionsFor(host) !== undefined;
}
/** The apps sign-in page, sending the person back to `returnTo` afterwards. */
export function hubLoginUrl(returnTo) {
    return returnTo ? `${HUB_URL}/login?next=${encodeURIComponent(returnTo)}` : `${HUB_URL}/login`;
}
/** Supabase URL + public key. Pass them explicitly, or set the two NEXT_PUBLIC_ variables. */
export function hubEnv(override) {
    const url = override?.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = override?.anonKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error("@agilitas/hub-sdk: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (ask Sid for the values).");
    }
    return { url, anonKey };
}
/** App keys are short, lowercase, with dashes: "ops-tracker". */
export function assertAppKey(appKey) {
    if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(appKey)) {
        throw new Error(`@agilitas/hub-sdk: "${appKey}" is not a valid app key (lowercase letters, digits and dashes).`);
    }
}
