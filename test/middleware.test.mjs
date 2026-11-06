import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { checkHub, hubMiddleware } from "../dist/middleware.js";
import { cookieOptionsFor } from "../dist/config.js";

const URL_ = "https://proj.supabase.co";
const env = { url: URL_, anonKey: "anon" };
let rpcAnswer = true, rpcError = false, rpcCalls = 0;

globalThis.fetch = async (input, init) => {
  const u = typeof input === "string" ? input : input.url;
  if (u.includes("/auth/v1/user")) {
    return new Response(JSON.stringify({ id: "u1", email: "jperry@agilitasenergy.com", aud: "authenticated", role: "authenticated" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (u.includes("/rest/v1/rpc/hub_has_access")) {
    rpcCalls++;
    if (rpcError) return new Response(JSON.stringify({ message: "boom", code: "XX000" }), { status: 500, headers: { "content-type": "application/json" } });
    return new Response(JSON.stringify(rpcAnswer), { status: 200, headers: { "content-type": "application/json" } });
  }
  throw new Error("unexpected fetch " + u);
};

const session = () => {
  const now = Math.floor(Date.now() / 1000);
  const json = JSON.stringify({ access_token: "a.b.c", refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user: { id: "u1", email: "jperry@agilitasenergy.com" } });
  return "base64-" + Buffer.from(json).toString("base64url");
};

function req(path, host, signedIn) {
  const headers = new Headers({ host });
  if (signedIn) {
    const name = cookieOptionsFor(host)?.name ?? "sb-proj-auth-token";
    headers.set("cookie", `${name}=${session()}`);
  }
  return new NextRequest(`https://${host}${path}`, { headers });
}
const opts = { appKey: "ops-tracker", env, publicPaths: ["/health"] };
const live = "ops.agilitasenergysolutions.com";
const loc = (r) => r.headers.get("location");

test("signed out on the live subdomain -> apps sign-in, comes back to the same page", async () => {
  const r = await hubMiddleware(opts)(req("/reports?q=1", live, false));
  assert.equal(r.status, 307);
  assert.equal(loc(r), "https://apps.agilitasenergysolutions.com/login?next=" + encodeURIComponent("https://ops.agilitasenergysolutions.com/reports?q=1"));
});
test("signed out API call -> 401 JSON", async () => {
  const r = await hubMiddleware(opts)(req("/api/items", live, false));
  assert.equal(r.status, 401);
});
test("public path is open without sign-in", async () => {
  const r = await hubMiddleware(opts)(req("/health", live, false));
  assert.equal(r.status, 200); assert.equal(loc(r), null);
});
test("signed in with access -> through", async () => {
  rpcAnswer = true; rpcError = false;
  const h = await checkHub(req("/", live, true), opts);
  assert.equal(h.stop, null); assert.equal(h.allowed, true); assert.equal(h.user?.email, "jperry@agilitasenergy.com");
});
test("signed in without access -> /no-access", async () => {
  rpcAnswer = false;
  const r = await hubMiddleware(opts)(req("/reports", live, true));
  assert.equal(r.status, 307); assert.equal(new URL(loc(r)).pathname, "/no-access");
});
test("API without access -> 403", async () => {
  rpcAnswer = false;
  const r = await hubMiddleware(opts)(req("/api/items", live, true));
  assert.equal(r.status, 403);
});
test("access check error fails closed", async () => {
  rpcError = true;
  const r = await hubMiddleware(opts)(req("/reports", live, true));
  assert.equal(new URL(loc(r)).pathname, "/no-access");
  rpcError = false;
});
test("/no-access itself is shown without an access check", async () => {
  rpcCalls = 0;
  const r = await hubMiddleware(opts)(req("/no-access", live, true));
  assert.equal(r.status, 200); assert.equal(rpcCalls, 0);
});
test("localhost signed out -> local dev sign-in, not the apps page", async () => {
  const r = await hubMiddleware(opts)(req("/reports", "localhost:3000", false));
  const u = new URL(loc(r));
  assert.equal(u.pathname, "/login"); assert.equal(u.searchParams.get("next"), "/reports");
});
test("localhost /login is open; on the live subdomain /login is not special", async () => {
  assert.equal((await hubMiddleware(opts)(req("/login", "localhost:3000", false))).status, 200);
  assert.match(loc(await hubMiddleware(opts)(req("/login", live, false))), /^https:\/\/apps\.agilitasenergysolutions\.com\/login/);
});
test("bad app key is rejected up front", () => {
  assert.throws(() => hubMiddleware({ appKey: "Ops Tracker", env }));
});
test("cookie settings: shared on our domain only", () => {
  assert.equal(cookieOptionsFor("ops.agilitasenergysolutions.com")?.domain, ".agilitasenergysolutions.com");
  assert.equal(cookieOptionsFor("agilitasenergysolutions.com.evil.com"), undefined);
  assert.equal(cookieOptionsFor("ops-tracker.vercel.app"), undefined);
});
