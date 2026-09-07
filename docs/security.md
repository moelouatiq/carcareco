# Security baseline

## Authorization model

ASP.NET Core applies `ServerSidePolicy` as both the default and fallback policy. Every controller action therefore requires an authenticated JWT carrying the `Root` role unless the action is explicitly marked `AllowAnonymous`.

The only public HTTP endpoints are:

- `POST /api/Users/authenticate` (rate limited);
- `POST /api/Demo/setup` (rate limited, disabled unless `Demo:Enabled=true`, and usable only in multi-tenant mode);
- `GET /health` (liveness endpoint).

Swagger is available only in `Development` and the local `Docker` environment. It is not registered in production. Static frontend assets are public and do not expose application data.

## Endpoint inventory

This inventory contains all 81 controller operations reported by ASP.NET ApiExplorer, plus the health endpoint. All entries are protected by the fallback policy except the public endpoints listed above.

| Area | Exact endpoints | Sensitive data or operation |
| --- | --- | --- |
| Clients | `GET /api/Clients/page`<br>`GET /api/Clients/{id}`<br>`POST /api/Clients`<br>`PUT /api/Clients/{id}`<br>`DELETE /api/Clients` | Reads and modifies customers and their contact details. |
| Legal clients | `GET /api/LegalClients/{id}`<br>`POST /api/LegalClients`<br>`PUT /api/LegalClients/{id}`<br>`DELETE /api/LegalClients` | Reads and modifies business customers. |
| Private clients | `GET /api/PrivateClients/{id}`<br>`POST /api/PrivateClients`<br>`PUT /api/PrivateClients/{id}`<br>`DELETE /api/PrivateClients` | Reads and modifies private customers. |
| Vehicles | `GET /api/Vehicles/page`<br>`GET /api/Vehicles/{id}`<br>`GET /api/Vehicles/client/{clientId}`<br>`POST /api/Vehicles`<br>`PUT /api/Vehicles/{id}`<br>`DELETE /api/Vehicles` | Reads and modifies vehicles and customer ownership. |
| Work | `GET /api/Work/page`<br>`GET /api/Work/{id}`<br>`POST /api/Work`<br>`PUT /api/Work/{id}`<br>`DELETE /api/Work`<br>`GET /api/Work/{id}/activities/{currentId}`<br>`POST /api/Work/{id}/makecopy`<br>`PUT /api/Work/{id}/status/{status}`<br>`POST /api/Work/{id}/repairjob`<br>`PUT /api/Work/{id}/repairjob/{jobNumber}`<br>`DELETE /api/Work/{id}/repairjob/{jobNumber}`<br>`GET /api/Work/repairjob/{jobId}/productsorservices`<br>`PUT /api/Work/repairjob/{jobId}/productsorservices`<br>`POST /api/Work/{id}/offer`<br>`PUT /api/Work/{id}/offer/{offerNumber}`<br>`DELETE /api/Work/{id}/offer/{offerNumber}`<br>`GET /api/Work/offer/{offerId}/productsorservices`<br>`PUT /api/Work/offer/{offerId}/productsorservices`<br>`PUT /api/Work/{id}/estimate/issue/{offerNumber}`<br>`PUT /api/Work/{id}/estimate/{offerNumber}/accepted/{targetJobNumber}`<br>`PUT /api/Work/estimate/send/{offerId}`<br>`PUT /api/Work/{id}/invoice/issue`<br>`PUT /api/Work/{id}/invoice/delete`<br>`PUT /api/Work/{id}/invoice/paid`<br>`PUT /api/Work/{id}/invoice/send` | Reads and modifies interventions, repair jobs, estimates, invoices, statuses, line items and mail delivery. |
| Jobs | `GET /api/Jobs/{id}`<br>`POST /api/Jobs`<br>`PUT /api/Jobs/{id}`<br>`DELETE /api/Jobs` | Reads and modifies repair jobs. |
| Pricing and PDF | `GET /api/Pricings/offers/{workId}`<br>`GET /api/Pricings/offer/{offerId}/{type}`<br>`GET /api/Pricings/invoice/{workId}/{type}` | Reads pricing data and generates estimate/invoice PDF files. |
| Employees | `GET /api/Employees`<br>`GET /api/Employees/page`<br>`GET /api/Employees/{id}`<br>`POST /api/Employees`<br>`PUT /api/Employees/{id}`<br>`DELETE /api/Employees` | Reads and modifies employees and application users. |
| User session | `POST /api/Users/authenticate` (public)<br>`POST /api/Users/extendsession`<br>`GET /api/Users/profilepicture` | Authenticates users, renews JWTs and reads the current user's avatar. The avatar JWT is sent only in the Authorization header. |
| Profile | `GET /api/Profile`<br>`PUT /api/Profile`<br>`PUT /api/Profile/changepassword`<br>`DELETE /api/Profile` | Reads and modifies the authenticated user's profile, password and account. |
| Configuration | `GET /api/Options`<br>`PUT /api/Options`<br>`GET /api/Options/dbdump` | Reads and modifies tenant settings and exports the database. |
| Inventory | `GET /api/SpareParts/page`<br>`GET /api/SpareParts/{id}`<br>`POST /api/SpareParts`<br>`PUT /api/SpareParts/{id}`<br>`PUT /api/spareparts/{id}/umprice`<br>`DELETE /api/SpareParts`<br>`GET /api/Storages`<br>`GET /api/Storages/page`<br>`GET /api/Storages/{id}`<br>`POST /api/Storages`<br>`PUT /api/Storages/{id}`<br>`DELETE /api/Storages` | Reads and modifies parts, prices and storage locations. |
| Search | `GET /api/Query/{searchText}` | Searches tenant business data. |
| Demo | `POST /api/Demo/setup` (public only when enabled) | Creates an isolated demo tenant and one-time credentials. |
| Health | `GET /health` (public) | Liveness only; it returns no configuration or business data. |

## Tenant isolation

The tenant database name comes only from the signed `ClaimTypes.Spn` claim. Tenant names are restricted to 1–63 ASCII letters, digits, `_` and `-`, must begin with a letter or digit, and are applied through `NpgsqlConnectionStringBuilder.Database`. User lookups that use employee identifiers include the tenant name in the predicate. Automated tests cover cross-tenant database-name separation and invalid tenant-name rejection.

## Tokens, cookies and logs

- The browser receives only an encrypted, `HttpOnly`, `SameSite=Lax` application session cookie. `Secure` is enabled when `NODE_ENV=production`.
- The backend JWT stays inside that encrypted cookie and is forwarded by Next.js server code in the Authorization header. It is never put in an avatar URL or query string.
- The legacy browser-readable `jwt` cookie is actively expired on login and logout.
- API failures never log Authorization headers, cookies, request bodies, response bodies or exception text. Unexpected backend responses and logs expose only a generic message and exception type.
- Docker excludes local env files, credentials and `appsettings.Secrets.json` from every image build context.
- Reusable GitHub workflows declare credentials under `workflow_call.secrets`; the frontend workflow never prints its generated env file.

## CORS and production startup requirements

`Cors:AllowedOrigins` is an exact configurable list. Wildcards and `AllowAnyOrigin` are not used, and credentials are not enabled. Local defaults allow only `http://localhost:3000` and `http://localhost:3002`. Production startup rejects HTTP and loopback origins, so the final Vercel HTTPS origin must be supplied before deployment.

Production startup also rejects missing, placeholder or short JWT/consumer secrets, JWT lifetimes above 12 hours, a missing persistent Data Protection key directory, or missing certificate protection for those keys.

The local API persists Data Protection keys in the Docker volume `dataprotectionkeys`. Production must mount a persistent directory outside the container and inject a PKCS#12 certificate path/password from the selected host's secret store. Keys must not be committed or stored unencrypted in PostgreSQL.
