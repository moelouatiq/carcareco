# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# copy solution & **all project directories**
COPY backend/src/Carmasters.sln .
COPY backend/src/. .

RUN dotnet restore Carmasters.sln

# publish API
RUN dotnet publish Carmasters.Http.Api/Carmasters.Http.Api.csproj \
        -c Release -o /app/publish

# ---------- dev ----------
# Keeps the SDK so `dotnet watch` can rebuild the sources bind-mounted over /src.
# docker-compose.override.yml selects this stage; production never builds it.
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dev
ENV ASPNETCORE_URLS=http://+:15567
# Docker Desktop does not forward inotify events across a bind mount, so the
# watcher has to poll or it will never see a host-side edit.
ENV DOTNET_USE_POLLING_FILE_WATCHER=true \
    DOTNET_WATCH_RESTART_ON_RUDE_EDIT=true
WORKDIR /src

COPY backend/install-browser-deps.sh /tmp/install-browser-deps.sh
RUN install -d -m 0700 /var/carcare/pdf /var/carcare/dataprotection-keys /opt/puppeteer \
    && sh /tmp/install-browser-deps.sh \
    && rm /tmp/install-browser-deps.sh

# The sources arrive from the bind mount at run time; warm the NuGet cache here
# so the first watch build does not have to restore from scratch.
COPY backend/src/Carmasters.sln .
COPY backend/src/. .
RUN dotnet restore Carmasters.sln

# --no-launch-profile: launchSettings.json pins ASPNETCORE_URLS to port 5567 and the
# Development environment, which would override what compose sets for the container.
ENTRYPOINT ["dotnet", "watch", "--project", "Carmasters.Http.Api", "run", "--no-launch-profile"]

# ---------- runtime ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0
ENV ASPNETCORE_URLS=http://+:15567
WORKDIR /app
COPY --from=build /app/publish .

COPY backend/install-browser-deps.sh /tmp/install-browser-deps.sh
RUN install -d -m 0700 /var/carcare/pdf /var/carcare/dataprotection-keys /opt/puppeteer \
    && sh /tmp/install-browser-deps.sh \
    && rm /tmp/install-browser-deps.sh

ENTRYPOINT ["dotnet","Carmasters.Http.Api.dll"]
