import { type CSSProperties, type ReactNode } from "react";
/** Icon link back to apps.agilitasenergysolutions.com. Put it in the header, before the user menu. */
export declare function AllDashboardsButton({ className, style }: {
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
/** Signs out of every Agilitas app and goes to the apps sign-in. */
export declare function SignOutButton({ className, style, children }: {
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
}): import("react").JSX.Element;
/** The page for signed-in people without access. Render it from app/no-access/page.tsx. */
export declare function NoAccess({ appName }: {
    appName: string;
}): import("react").JSX.Element;
/**
 * Password sign-in for localhost and *.vercel.app previews only, where the
 * apps sign-in can't hand over a session. Mount it at app/login/page.tsx.
 * On the real subdomain people never see it: they go to the apps sign-in.
 */
export declare function HubDevSignIn({ appName }: {
    appName?: string;
}): import("react").JSX.Element;
