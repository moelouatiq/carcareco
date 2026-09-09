FROM mcr.microsoft.com/dotnet/sdk:9.0
WORKDIR /src

COPY backend/src/Carmasters.sln .
COPY backend/src/. .

RUN dotnet restore Carmasters.Tests/Carmasters.Tests.csproj --locked-mode

ENTRYPOINT ["dotnet", "test", "Carmasters.Tests/Carmasters.Tests.csproj", "-c", "Release", "--no-restore", "--logger", "console;verbosity=normal"]
