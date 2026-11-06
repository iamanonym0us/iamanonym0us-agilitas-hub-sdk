export declare const HUB_URL = "https://apps.agilitasenergysolutions.com";
export declare const SHARED_DOMAIN = "agilitasenergysolutions.com";
export declare const SHARED_COOKIE_NAME = "sb-agilitas-auth";
export declare const SUPPORT_EMAIL = "ssuresh@agilitasenergy.com";
/**
 * Cookie settings for the Supabase session.
 * On *.agilitasenergysolutions.com: one cookie for the parent domain, shared
 * by every Agilitas app. Anywhere else (localhost, *.vercel.app previews):
 * undefined, i.e. Supabase's default cookie for this host only.
 */
export declare function cookieOptionsFor(host: string | null | undefined): {
    name: string;
    domain: string;
    path: string;
    sameSite: "lax";
    secure: boolean;
} | undefined;
/** True when the shared sign-in can work on this host. */
export declare function isSharedHost(host: string | null | undefined): boolean;
/** The apps sign-in page, sending the person back to `returnTo` afterwards. */
export declare function hubLoginUrl(returnTo?: string): string;
export type HubEnv = {
    url: string;
    anonKey: string;
};
/** Supabase URL + public key. Pass them explicitly, or set the two NEXT_PUBLIC_ variables. */
export declare function hubEnv(override?: Partial<HubEnv>): HubEnv;
/** App keys are short, lowercase, with dashes: "ops-tracker". */
export declare function assertAppKey(appKey: string): void;
