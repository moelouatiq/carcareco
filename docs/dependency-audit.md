# Dependency audit

Audit date: 2026-09-08. Commands were run from the repository checkout on
`chore/local-supabase-vercel-setup`; npm used the `frontend` directory and .NET
commands used `backend/src/Carmasters.sln` with the .NET 9 SDK.

## Commands

```text
npm audit --audit-level=low
npm outdated
dotnet list Carmasters.sln package --vulnerable --include-transitive
dotnet list Carmasters.sln package --outdated
```

No automatic or forced audit fix was used.

## Before the controlled upgrade

- `npm audit`: 14 vulnerabilities: 2 low, 3 moderate, 8 high, and 1 critical.
  The critical advisory affected Next.js; the other findings included `sharp`,
  `uuid`, and ESLint's dependency graph.
- NuGet audit: AutoMapper 13.0.1 was a direct high-severity finding
  ([GHSA-rvv3-g6hj-g44x](https://github.com/advisories/GHSA-rvv3-g6hj-g44x)).
  NuGet also reported the transitive packages described in the remaining-findings
  table below.

## Decisions and resulting versions

| Area | Before | After | Decision |
| --- | --- | --- | --- |
| Next.js | 15.1.7 | 16.3.4 | Upgraded with the official codemod, including async request APIs and `middleware.ts` to `proxy.ts`. |
| React / React DOM | 19.0.x | 19.2.8 | Upgraded with Next.js 16. |
| ESLint config | 15.1.6 | 16.3.4 | Migrated to native flat configuration; ESLint remains on compatible 9.39.5 because the current plugin graph does not support ESLint 10. |
| `sharp` | 0.33.5 | 0.35.4 | Upgraded past the audited vulnerable range. |
| `uuid` | 11.0.5 | 14.0.2 | Upgraded past the audited vulnerable range. |
| `jwt-decode` | 4.0.0 | removed | It was unused after server-side session handling. |
| AutoMapper | 13.0.1 | removed | Corrected releases 15.1.1/16.1.1 require a commercial license in current AutoMapper versions. Buying a license is forbidden for this project, and only six small one-way mappings were used. They were replaced by a bounded internal mapper with no recursive graph traversal. |

The upgrade intentionally does not combine unrelated major upgrades such as
.NET 9 to .NET 10, Npgsql 9 to 10, DbUp 5 to 7, PuppeteerSharp 20 to 25, or
Swashbuckle 7 to 10. Those require separate compatibility work and are not the
source of the blocking findings handled here.

## Results after the upgrade

### npm

```text
found 0 vulnerabilities
```

`npm install`, ESLint, `tsc --noEmit`, and the Next.js 16 Turbopack production
build complete successfully. The lockfile resolves Next.js 16.3.4, React and
React DOM 19.2.8, `sharp` 0.35.4, and `uuid` 14.0.2.

### NuGet

The AutoMapper advisory is eliminated and both the API and DbUp compile in
Release mode with 0 warnings and 0 errors. The audit still reports these two
legacy transitive package records:

| Dependency | Severity | Projects reported | Exploitability in CarCare | Fix and decision |
| --- | --- | --- | --- | --- |
| `System.Net.Http` 4.3.0, [GHSA-7jgj-8wvc-jh57](https://github.com/advisories/GHSA-7jgj-8wvc-jh57) | High | Application, PostgreSQL repository, API, DbUp | Low for this build. The advisory applies to .NET Core 1.0/1.1/2.1 redirect handling. CarCare targets .NET 9, and no `System.Net.Http.dll` from this package is copied to any `net9.0` Release output; the .NET 9 shared-framework implementation is used. | Package 4.3.4 is fixed. The 4.3.0 metadata enters through NHibernate's old `Antlr3.Runtime`/`Iesi.Collections` → `NETStandard.Library` graph. Do not add an obsolete framework-package override merely to hide the audit record; re-evaluate during the planned NHibernate/runtime upgrade. |
| `System.Text.RegularExpressions` 4.3.0, [GHSA-cmhx-cq75-c4mj](https://github.com/advisories/GHSA-cmhx-cq75-c4mj) | High | Application, PostgreSQL repository, API, DbUp | Low for this build. CarCare uses the .NET 9 shared-framework regex implementation; no package `System.Text.RegularExpressions.dll` is copied to the Release outputs. No endpoint constructs a regex from untrusted input in this dependency path. | Package 4.3.1 is fixed. The record comes from the same legacy `NETStandard.Library` dependency graph. Retain the audit visibility and address it with a separately tested NHibernate/runtime upgrade rather than forcing an old framework assembly into the application. |

Exact post-upgrade project result: `Carmasters.Core.Domain` and
`Carmasters.Http.Api.Model` have no vulnerable packages; the other four
projects report only the two transitive records above. No advisory is
suppressed in NuGet configuration.

## Outdated packages snapshot

`dotnet list package --outdated` reported the following direct updates. This is
an inventory, not approval to take major upgrades:

```text
Carmasters.Core.Persistence.Postgres
FluentNHibernate 3.4.0 -> 3.5.0
Microsoft.Extensions.Configuration.Abstractions 9.0.2 -> 10.0.11
Microsoft.Extensions.Logging.Abstractions 9.0.2 -> 10.0.11
NHibernate 5.5.2 -> 5.7.0
Npgsql 9.0.2 -> 10.0.3

Carmasters.Core.Application
BCrypt.Net-Next 4.0.3 -> 4.2.0
Dapper 2.1.66 -> 2.1.79
FluentNHibernate 3.4.0 -> 3.5.0
Microsoft.AspNetCore.Authentication.JwtBearer 9.0.2 -> 10.0.11
Microsoft.Extensions.DependencyInjection.Abstractions 9.0.2 -> 10.0.11
Microsoft.Extensions.Options.ConfigurationExtensions 9.0.2 -> 10.0.11
Newtonsoft.Json 13.0.3 -> 13.0.4
Npgsql 9.0.2 -> 10.0.3
PuppeteerSharp 20.1.0 -> 25.10.0
Swashbuckle.AspNetCore.SwaggerGen 7.2.0 -> 10.2.3
System.IdentityModel.Tokens.Jwt 8.4.0 -> 8.22.0

Carmasters.Http.Api
BCrypt.Net-Next 4.0.3 -> 4.2.0
Dapper 2.1.66 -> 2.1.79
Microsoft.AspNetCore.Authentication.JwtBearer 9.0.2 -> 10.0.11
Npgsql 9.0.2 -> 10.0.3
PuppeteerSharp 20.1.0 -> 25.10.0
Scrutor 6.0.1 -> 7.0.0
Swashbuckle.AspNetCore 7.2.0 -> 10.2.3

DbUp
DbUp-PostgreSQL 5.0.40 -> 7.0.1
Microsoft.Extensions.Configuration 9.0.2 -> 10.0.11
Microsoft.Extensions.Configuration.Binder 9.0.2 -> 10.0.11
Microsoft.Extensions.Configuration.Json 9.0.2 -> 10.0.11
Npgsql 9.0.2 -> 10.0.3
```

The npm outdated inventory likewise contains non-security feature/major
updates. It is deliberately not used as a reason for broad churn after the
security audit reached zero findings.
