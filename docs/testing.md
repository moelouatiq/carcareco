# Testing CarCare

The test suite is intentionally targeted at security controls and the critical workshop flow. Integration tests use the dedicated `carcare-tests` Compose project, a PostgreSQL `tmpfs`, and separate containers. They do not mount or modify the normal local `dbdata` volume.

Run the secret bootstrap once before integration tests if the ignored local configuration files do not exist:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-secrets.ps1
```

Never copy the generated values into test output or tracked files.

## Frontend

```powershell
Set-Location frontend
npm ci
npm audit
npm test
npm run lint
npm run typecheck
npm run build
```

The Vitest suite verifies session encryption and cookie policy, rejects sensitive API query parameters, sanitizes API errors, and guards source/CI invariants against JWT or environment-file disclosure.

After a frontend dependency upgrade, refresh the development-only anonymous `node_modules` volume before browser testing. This does not affect PostgreSQL or application data:

```powershell
docker compose up -d --no-deps --force-recreate --renew-anon-volumes web
```

## Backend unit tests

```powershell
Set-Location backend/src
dotnet restore Carmasters.sln --locked-mode
dotnet build Carmasters.sln -c Release --no-restore
dotnet test Carmasters.Tests/Carmasters.Tests.csproj -c Release --no-build --filter "Category!=Integration"
```

These tests cover the internal DTO mapper and tenant database-name isolation without requiring PostgreSQL.

## Isolated backend integration tests

From the repository root:

```powershell
docker compose -p carcare-tests -f docker-compose.test.yml build
docker compose -p carcare-tests -f docker-compose.test.yml up -d --wait db
docker compose -p carcare-tests -f docker-compose.test.yml run --rm migrate
docker compose -p carcare-tests -f docker-compose.test.yml up -d --no-deps --wait api
docker compose -p carcare-tests -f docker-compose.test.yml run --rm --no-deps tests
$testExitCode = $LASTEXITCODE
docker compose -p carcare-tests -f docker-compose.test.yml down --remove-orphans
exit $testExitCode
```

The migration is a one-shot container, so it is run before the API instead of using `docker compose up --abort-on-container-exit`. The suite exercises anonymous and authorized API access, invalid JWT tenant tampering, primary input validation, client and vehicle creation, work and estimate creation, acceptance into a repair job, invoice issuance, and real Chromium PDF generation.

For an optional browser inspection of the isolated test data, start `web` after the API and open <http://127.0.0.1:3302>. The test API and frontend bind to loopback only (`16567` and `3302` respectively):

```powershell
docker compose -p carcare-tests -f docker-compose.test.yml up -d --no-deps web
```

The named `carcare-tests_test-browser-cache` volume only caches the downloaded browser. Remove that regenerable cache when needed with:

```powershell
docker compose -p carcare-tests -f docker-compose.test.yml down --volumes --remove-orphans
```

Do not add `-v` to commands for the normal local Compose project unless its PostgreSQL data has first been backed up.
