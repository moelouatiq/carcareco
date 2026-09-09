#!/bin/sh
# Vercel tells the container which port to listen on through PORT, defaulting to 80.
# appsettings.Production.json pins a Kestrel endpoint, and a configured Kestrel:Endpoints section
# replaces whatever ASPNETCORE_URLS or --urls asked for, so the endpoint has to be overridden
# through configuration rather than around it. Environment variables outrank the JSON file.
set -e

# Chromium derives its crash handler database from HOME. The base image leaves HOME at /root, which
# is read-only on a container host; the path then resolves to nothing and chrome_crashpad_handler
# exits with "--database is required", taking the browser down with it before any page is rendered.
# /tmp is the one writable location such a host guarantees, and it is empty at every start.
export HOME=/tmp/carcare-home
mkdir -p "$HOME"

export Kestrel__Endpoints__Http__Url="http://0.0.0.0:${PORT:-80}"

exec dotnet Carmasters.Http.Api.dll
