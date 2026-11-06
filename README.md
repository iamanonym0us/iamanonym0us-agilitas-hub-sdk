# @agilitas/hub-sdk

Plugs a Next.js app into [apps.agilitasenergysolutions.com](https://apps.agilitasenergysolutions.com):
one Agilitas sign-in, an access check on every request, and the "All dashboards" button.
Your app never builds its own login or user list.

Works with Next.js 14.2+ (tested on 15.5 and 16.4) and `@supabase/ssr` 0.5+.

## Install

```bash
npm i github:iamanonym0us/iamanonym0us-agilitas-hub-sdk#v1.0.0 @supabase/ssr @supabase/supabase-js
```

Set two environment variables (local `.env.local` and Vercel). Sid has the values:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Use it

Pick your app key with Sid (short, lowercase, dashes: `ops-tracker`). It must match the key on the apps admin page.

**1. Middleware**, which checks sign-in and access on every request.

```ts
// Next 16: proxy.ts           // Next 15: middleware.ts
import { hubMiddleware } from "@agilitas/hub-sdk/middleware";

export const proxy = hubMiddleware({ appKey: "ops-tracker" });   // Next 15: export const middleware = ...

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
```

| Who | Pages | `/api/*` |
| --- | --- | --- |
| Signed out, on the live subdomain | sent to the apps sign-in, then back to the same page | 401 |
| Signed out, on localhost or a preview | sent to your `/login` (dev sign-in, below) | 401 |
| Signed in, no access to this app | sent to `/no-access` | 403 |
| Signed in with access | through | through |

Options: `publicPaths` (open without sign-in, e.g. `["/health"]`), `noAccessPath` (default `/no-access`),
`devLoginPath` (default `/login`). Need your own rules too? Use `checkHub(request, opts)`: return `hub.stop` if set,
otherwise add your logic and return `hub.response`.

**2. Two pages**

```tsx
// app/no-access/page.tsx
import { NoAccess } from "@agilitas/hub-sdk/react";
export default function Page() { return <NoAccess appName="Ops tracker" />; }

// app/login/page.tsx: only used on localhost and *.vercel.app previews
import { HubDevSignIn } from "@agilitas/hub-sdk/react";
export default function Page() { return <HubDevSignIn appName="Ops tracker" />; }
```

**3. Header**

```tsx
import { AllDashboardsButton, SignOutButton } from "@agilitas/hub-sdk/react";

<AllDashboardsButton />   {/* icon link to apps; pass className to style it */}
<SignOutButton />         {/* signs out of every Agilitas app */}
```

**4. Supabase clients.** Always use these, never `createBrowserClient` / `createServerClient` directly.
A client without the shared cookie settings writes a second session and signs people out.

```ts
import { createHubServerClient, getHubViewer } from "@agilitas/hub-sdk/server";   // server components, route handlers, actions
import { createHubBrowserClient, signOutEverywhere } from "@agilitas/hub-sdk/client"; // client components

const me = await getHubViewer("ops-tracker"); // { email, name, hasAccess, isAdmin }
```

## Your app's tables

The middleware guards pages, but Supabase is reachable directly with the public key, so tables need the same rule.
Prefix tables with the app key, turn on row-level security, and add a restrictive policy:

```sql
create policy ops_tracker_members_only on public.ops_tracker_items as restrictive for all to authenticated
  using ((select public.hub_has_access('ops-tracker')))
  with check ((select public.hub_has_access('ops-tracker')));
```

Send database changes to Sid as a migration file. The service-role key stays server-side, in Vercel only.

## Testing

Preview links and localhost can't read the shared sign-in, so they use the dev sign-in page with an Agilitas
email and password. Test the hand-off from the apps page on the real subdomain.

## Going live

Hand Sid the app key, the https address, and a one-line description. He adds the tile on the apps admin page
and switches people on. Until then, the app turns everyone away, which is expected.

## Updating

Releases are tags (`v1.0.0`, `v1.1.0`, ...). Bump the `#tag` in `package.json` to upgrade.
