# Hosting on Vercel with Supabase

How the application is deployed to Vercel, and why each part is arranged the way it is. Validated on
a preview deployment in September 2026 against a Supabase staging project. The application stack is
unchanged: ASP.NET Core 9 with NHibernate and Dapper, DbUp migrations, PuppeteerSharp for PDFs, and
Next.js on the front.

## Shape

```text
Browser
  │
  ▼
Vercel  ──  frontend service : Next.js (native runtime)
                  │  service binding, injected as API_URL
                  ▼
            backend service  : ASP.NET Core 9, container image
                  │  TLS verify-full
                  ▼
            Supabase PostgreSQL
```

Both services live in one Vercel project, declared in `vercel.json` under `services`. They share a
domain, one set of environment variables, and a single preview per branch, so a preview's frontend
always talks to that same preview's backend.

Functions run in `cdg1` (Paris), the region the Supabase project sits in. A single region is what the
Hobby plan allows, and it is the one that matters here.

## The backend is not reachable from the internet

Public traffic on Vercel enters only through top-level rewrites. `vercel.json` declares exactly one,
and it sends everything to the frontend. The backend has none, so it has no route from the internet
at all — not a protected route, no route. On the deployed preview `/health`, `/swagger` and
`/api/clients/page` all answer with the frontend's 404.

The frontend reaches it over a service binding, which Vercel injects as `API_URL`. That is the name
the server-side API client (`frontend/src/_lib/server/query-api.ts`) and the proxy route
(`frontend/src/app/api/backend/[...path]/route.ts`) already read, so no application code knows it is
running on Vercel.

**`API_URL` must never be set by hand** on Vercel: the binding generates it, and its value is
deployment-aware.

## Same origin

The browser never addresses the backend. Server-rendered pages call it from the server; the few
browser-initiated calls (profile picture, invoice and estimate PDFs) go to `/api/backend/*`, a route
handler that attaches the session's JWT and forwards to `API_URL`.

`NEXT_PUBLIC_API_URL` is gone. It existed for one anonymous call from the marketing page to
`/api/Demo/setup`, which now goes through `/api/demo/setup` — a route handler of its own rather than
an unauthenticated exception on the general proxy.

Because nothing crosses origins, no CORS policy is exercised at run time. `Cors:AllowedOrigins` still
has to be set, because the production guard refuses an empty list and rejects loopback and non-HTTPS
origins; give it the deployment's own origin. **Never a wildcard.** Note that .NET merges
configuration arrays by index: overriding `Cors__AllowedOrigins__0` alone leaves `appsettings.json`'s
second entry in place and startup fails.

## Container image

`backend/Dockerfile.vercel` builds the backend. It sits beside the existing `backend/Dockerfile`,
which the local Docker Compose stack keeps using unchanged. The build context is `backend/`, so
`backend/.dockerignore` is the one that applies.

Three things differ from the local image, all consequences of a stateless host with a read-only
filesystem:

- **Chromium is baked in** at a pinned build rather than downloaded on first use. The runtime host
  has nowhere to write a download, and resolving "stable" at run time would hand a different browser
  to every deployment. The build fails if the pinned version cannot be fetched or does not report
  itself as that version — there is no fallback. `PuppeteerExecutablePath` points at it, and
  `PdfGenerator` uses a configured browser as given and never reaches for `BrowserFetcher`.
- **The port comes from `PORT`**, defaulting to 80. `appsettings.Production.json` pins a Kestrel
  endpoint, and a configured `Kestrel:Endpoints` section replaces whatever `ASPNETCORE_URLS` or
  `--urls` asked for, so the entrypoint overrides it through configuration rather than around it.
  The file is left alone.
- **`HOME` moves to a writable path.** The base image leaves it at `/root`, Chromium derives its
  crash handler database from it, and on a read-only root the path resolves to nothing and
  `chrome_crashpad_handler` kills the browser before any page renders.

Nothing is written outside `/tmp` at run time. Each PDF render gets its own Chromium profile
directory there and removes it afterwards.

## Data Protection

`DataProtection:Ephemeral=true` keeps the key ring in memory, so no persistent directory and no
PKCS#12 file are needed. It has to be set explicitly; an unreadable value is refused rather than
quietly ignored, and with the flag absent the file-backed key ring and its production guards behave
exactly as before.

This is acceptable **only because nothing in this application consumes Data Protection**: no
`IDataProtector` is resolved anywhere, authentication is JWT bearer and those tokens are signed from
`JwtOptions.Secret`, and no cookie authentication, ASP.NET session, antiforgery or persisted TempData
depends on the key ring. No payload has to survive a restart.

**Revisit this the moment any of those is introduced.** Keys would then have to be shared between
instances and persisted, and an in-memory key ring would start losing data.

## Database

Supabase is reached through Supavisor in **session mode on port 5432**, which is what NHibernate
needs. `DbOptions:SslMode=VerifyFull` with `DbOptions:RootCertificate` pointing at the CA in the
image; verification is never traded away.

Supabase issues its server certificates from a private root that the public trust store does not
carry, and a host that builds the image from the repository has no other channel to supply it, so
`backend/certs/prod-ca-2021.crt` is versioned. It is a public, self-signed CA certificate with no key
material. The ignore rules are written so that only that file is versionable: anything else dropped
in the directory stays ignored.

DbUp remains the only source of truth for the schema and is not run at startup.

**There is currently no reason to change the pooling.** A connection failure seen locally after three
restarts in a few seconds did not reproduce on Vercel across six distinct cold starts, and the
runtime logs carried no `Npgsql`, `EndOfStreamException`, `SocketException` or `BuildSessionFactory`
error. Any change to Npgsql pooling, NHibernate or the session factory bootstrap should wait for
evidence from real usage.

## Images

`images.unoptimized = true` is required with this architecture. In services mode the top-level
rewrite hands every path to a service, and Vercel's image optimizer sits outside them, so
`/_next/image` answers 404 and every optimized URL `next/image` emits resolves to nothing. Serving
the sources directly costs little here — the assets are a handful of small local files — and it
avoids a route exception. It also means no image transformations are billed.

## Environment variables

Set on the Vercel project, per environment. Names only; values belong in Vercel, never in the
repository.

Backend: `ASPNETCORE_ENVIRONMENT`, `DataProtection__Ephemeral`, `DbOptions__Host`, `DbOptions__Port`,
`DbOptions__UserId`, `DbOptions__Password`, `DbOptions__Name`, `DbOptions__SslMode`,
`DbOptions__RootCertificate`, `DbOptions__MultiTenancy__Enabled`, `JwtOptions__Secret`,
`JwtOptions__ConsumerSecret`, `Cors__AllowedOrigins__0`, `Cors__AllowedOrigins__1`.

Frontend: `SERVER_SECRET` (must equal `JwtOptions__ConsumerSecret`), `SESSION_SECRET`,
`NEXT_PUBLIC_SESSION_TIMEOUT`, `NEXT_PUBLIC_SESSION_DIALOG_TIMEOUT`.

Not set: `API_URL` comes from the binding, and `NEXT_PUBLIC_API_URL` no longer exists.
`PuppeteerExecutablePath` is already an `ENV` in the image, and `PORT` can be left unset.

Vercel environment variables are project-scoped, so both services receive all of them. None of the
backend values carry the `NEXT_PUBLIC_` prefix, so none reach the browser.

## Known limitations

- **Backend cold start ≈ 5.5 s.** The NHibernate session factory is built during startup and opens a
  connection there, so the first request after a scale-down pays for it.
- **Chromium is launched per PDF render**, costing roughly 2.5 s that a shared browser would avoid.
  Sharing one raises concurrency and lifecycle questions on a scale-to-zero host, so it is a separate
  decision rather than a detail of this setup.
- **A PDF takes a few seconds** end to end, which is acceptable for staging.
- **The `next/image` optimizer is disabled**, as described above.
- **The Hobby plan is for non-commercial use only.** Vercel's fair use guidelines define commercial
  usage broadly enough to include a workshop management tool used by a business, so Hobby suits
  staging and demos. Provisioned Memory is also the first ceiling in practice: the included
  allowance divided by the plan's fixed 2 GB per instance works out to a limited number of instance
  hours per month.
- **Running this commercially in production is a separate decision**, not covered here.
