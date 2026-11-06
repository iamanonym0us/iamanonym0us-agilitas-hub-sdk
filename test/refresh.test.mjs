import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { hubMiddleware } from "../dist/middleware.js";

let refreshed = 0;
globalThis.fetch = async (input) => {
  const u = typeof input === "string" ? input : input.url;
  const j = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
  if (u.includes("/auth/v1/token")) {
    refreshed++;
    const now = Math.floor(Date.now() / 1000);
    return j({ access_token: "new.access.token", refresh_token: "r2", token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user: { id: "u1", email: "jperry@agilitasenergy.com" } });
  }
  if (u.includes("/auth/v1/user")) return j({ id: "u1", email: "jperry@agilitasenergy.com", aud: "authenticated" });
  if (u.includes("/rpc/hub_has_access")) return j(false);
  throw new Error("unexpected " + u);
};

test("a session refreshed during a redirect keeps its new cookie on the shared domain", async () => {
  const old = Math.floor(Date.now() / 1000) - 60;
  const json = JSON.stringify({ access_token: "old.a.b", refresh_token: "r1", token_type: "bearer", expires_in: 3600, expires_at: old, user: { id: "u1" } });
  const req = new NextRequest("https://ops.agilitasenergysolutions.com/reports", {
    headers: { host: "ops.agilitasenergysolutions.com", cookie: `sb-agilitas-auth=base64-${Buffer.from(json).toString("base64url")}` },
  });
  const r = await hubMiddleware({ appKey: "ops-tracker", env: { url: "https://proj.supabase.co", anonKey: "anon" } })(req);
  assert.equal(refreshed, 1);
  assert.equal(new URL(r.headers.get("location")).pathname, "/no-access");
  const setCookie = r.headers.getSetCookie().join("\n");
  assert.match(setCookie, /sb-agilitas-auth=base64-/);
  assert.match(setCookie, /Domain=\.agilitasenergysolutions\.com/i);
});
