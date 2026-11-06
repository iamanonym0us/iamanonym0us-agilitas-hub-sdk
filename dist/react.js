"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { createHubBrowserClient, signOutEverywhere } from "./client.js";
import { HUB_URL, SUPPORT_EMAIL } from "./config.js";
const GRID = (_jsxs("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [_jsx("rect", { x: "3.5", y: "3.5", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "13.5", y: "3.5", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "3.5", y: "13.5", width: "7", height: "7", rx: "1.5" }), _jsx("rect", { x: "13.5", y: "13.5", width: "7", height: "7", rx: "1.5" })] }));
const iconButton = {
    display: "inline-grid",
    placeItems: "center",
    width: 36,
    height: 36,
    borderRadius: 10,
    color: "inherit",
    textDecoration: "none",
};
/** Icon link back to apps.agilitasenergysolutions.com. Put it in the header, before the user menu. */
export function AllDashboardsButton({ className, style }) {
    return (_jsx("a", { href: HUB_URL, title: "All dashboards", "aria-label": "All dashboards", className: className, style: className ? style : { ...iconButton, ...style }, children: GRID }));
}
/** Signs out of every Agilitas app and goes to the apps sign-in. */
export function SignOutButton({ className, style, children }) {
    const [busy, setBusy] = useState(false);
    return (_jsx("button", { type: "button", className: className, style: style, disabled: busy, onClick: async () => {
            setBusy(true);
            await signOutEverywhere();
        }, children: children ?? "Sign out" }));
}
const page = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 24,
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};
const card = {
    maxWidth: 420,
    width: "100%",
    padding: 28,
    borderRadius: 16,
    border: "1px solid rgba(127,127,127,.25)",
    display: "grid",
    gap: 14,
};
const primary = {
    display: "block",
    textAlign: "center",
    padding: "10px 14px",
    borderRadius: 10,
    background: "#14254d",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 600,
    border: 0,
    cursor: "pointer",
    font: "inherit",
};
const quiet = { ...primary, background: "transparent", color: "inherit", border: "1px solid rgba(127,127,127,.35)" };
/** The page for signed-in people without access. Render it from app/no-access/page.tsx. */
export function NoAccess({ appName }) {
    const subject = encodeURIComponent(`Access to ${appName}`);
    return (_jsx("main", { style: page, children: _jsxs("div", { style: card, children: [_jsxs("h1", { style: { margin: 0, fontSize: 22 }, children: ["You don't have access to ", appName, " yet"] }), _jsx("p", { style: { margin: 0, opacity: 0.75, lineHeight: 1.5 }, children: "Ask Sid to switch it on for you. Your other Agilitas dashboards are still on the apps page." }), _jsx("a", { href: `mailto:${SUPPORT_EMAIL}?subject=${subject}`, style: primary, children: "Request access" }), _jsx("a", { href: HUB_URL, style: quiet, children: "All dashboards" }), _jsx(SignOutButton, { style: { ...quiet, background: "none" }, children: "Sign out" })] }) }));
}
/**
 * Password sign-in for localhost and *.vercel.app previews only, where the
 * apps sign-in can't hand over a session. Mount it at app/login/page.tsx.
 * On the real subdomain people never see it: they go to the apps sign-in.
 */
export function HubDevSignIn({ appName = "this app" }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const { error } = await createHubBrowserClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        setBusy(false);
        if (error) {
            setError(/invalid/i.test(error.message) ? "That email and password don't match." : error.message);
            return;
        }
        const next = new URLSearchParams(window.location.search).get("next") ?? "/";
        window.location.assign(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    }
    const input = { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(127,127,127,.35)", font: "inherit" };
    return (_jsx("main", { style: page, children: _jsxs("form", { style: card, onSubmit: submit, children: [_jsxs("h1", { style: { margin: 0, fontSize: 22 }, children: ["Sign in to ", appName] }), _jsx("p", { style: { margin: 0, opacity: 0.75, lineHeight: 1.5 }, children: "Development sign-in. Use your Agilitas account; on the live site this happens on the apps page." }), _jsx("input", { style: input, type: "email", autoComplete: "email", placeholder: "name@agilitasenergy.com", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx("input", { style: input, type: "password", autoComplete: "current-password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), error && _jsx("p", { role: "alert", style: { margin: 0, color: "#b42318" }, children: error }), _jsx("button", { type: "submit", style: primary, disabled: busy, children: busy ? "One moment…" : "Sign in" })] }) }));
}
