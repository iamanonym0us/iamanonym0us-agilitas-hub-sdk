"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { createHubBrowserClient, signOutEverywhere } from "./client.js";
import { HUB_URL, SUPPORT_EMAIL } from "./config.js";

const GRID = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </svg>
);

const iconButton: CSSProperties = {
  display: "inline-grid",
  placeItems: "center",
  width: 36,
  height: 36,
  borderRadius: 10,
  color: "inherit",
  textDecoration: "none",
};

/** Icon link back to apps.agilitasenergysolutions.com. Put it in the header, before the user menu. */
export function AllDashboardsButton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <a
      href={HUB_URL}
      title="All dashboards"
      aria-label="All dashboards"
      className={className}
      style={className ? style : { ...iconButton, ...style }}
    >
      {GRID}
    </a>
  );
}

/** Signs out of every Agilitas app and goes to the apps sign-in. */
export function SignOutButton({ className, style, children }: { className?: string; style?: CSSProperties; children?: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      style={style}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOutEverywhere();
      }}
    >
      {children ?? "Sign out"}
    </button>
  );
}

const page: CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};
const card: CSSProperties = {
  maxWidth: 420,
  width: "100%",
  padding: 28,
  borderRadius: 16,
  border: "1px solid rgba(127,127,127,.25)",
  display: "grid",
  gap: 14,
};
const primary: CSSProperties = {
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
const quiet: CSSProperties = { ...primary, background: "transparent", color: "inherit", border: "1px solid rgba(127,127,127,.35)" };

/** The page for signed-in people without access. Render it from app/no-access/page.tsx. */
export function NoAccess({ appName }: { appName: string }) {
  const subject = encodeURIComponent(`Access to ${appName}`);
  return (
    <main style={page}>
      <div style={card}>
        <h1 style={{ margin: 0, fontSize: 22 }}>You don&apos;t have access to {appName} yet</h1>
        <p style={{ margin: 0, opacity: 0.75, lineHeight: 1.5 }}>
          Ask Sid to switch it on for you. Your other Agilitas dashboards are still on the apps page.
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}`} style={primary}>Request access</a>
        <a href={HUB_URL} style={quiet}>All dashboards</a>
        <SignOutButton style={{ ...quiet, background: "none" }}>Sign out</SignOutButton>
      </div>
    </main>
  );
}

/**
 * Password sign-in for localhost and *.vercel.app previews only, where the
 * apps sign-in can't hand over a session. Mount it at app/login/page.tsx.
 * On the real subdomain people never see it: they go to the apps sign-in.
 */
export function HubDevSignIn({ appName = "this app" }: { appName?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
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

  const input: CSSProperties = { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(127,127,127,.35)", font: "inherit" };
  return (
    <main style={page}>
      <form style={card} onSubmit={submit}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Sign in to {appName}</h1>
        <p style={{ margin: 0, opacity: 0.75, lineHeight: 1.5 }}>
          Development sign-in. Use your Agilitas account; on the live site this happens on the apps page.
        </p>
        <input style={input} type="email" autoComplete="email" placeholder="name@agilitasenergy.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={input} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p role="alert" style={{ margin: 0, color: "#b42318" }}>{error}</p>}
        <button type="submit" style={primary} disabled={busy}>{busy ? "One moment…" : "Sign in"}</button>
      </form>
    </main>
  );
}
