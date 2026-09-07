# Paths
$ErrorActionPreference = "Stop"

$AppSettingsExample = "backend/src/Carmasters.Http.Api/appsettings.Secrets.json.example"
$AppSettingsTarget  = "backend/src/Carmasters.Http.Api/appsettings.Secrets.json"
$EnvExample         = "frontend/.env.example"
$EnvTarget          = "frontend/.env"
$DockerEnvTarget    = ".env"
$CredentialsTarget  = "local-credentials.txt"

# Create files from example
Copy-Item $AppSettingsExample $AppSettingsTarget -Force
Copy-Item $EnvExample $EnvTarget -Force

# Generate secrets
function New-CryptoBytes([int]$Length) {
    $Bytes = New-Object byte[] $Length
    $Generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $Generator.GetBytes($Bytes)
    }
    finally {
        $Generator.Dispose()
    }
    return ,$Bytes
}

function New-HexSecret([int]$Length) {
    return -join ((New-CryptoBytes $Length) | ForEach-Object { $_.ToString("x2") })
}

$JwtSecret = New-HexSecret 64
$ConsumerSecret = [Convert]::ToBase64String((New-CryptoBytes 32))
$SessionSecret  = [Convert]::ToBase64String((New-CryptoBytes 32))
$DbUser = "carcare_$(New-HexSecret 4)"
$DbPassword = [Convert]::ToBase64String((New-CryptoBytes 32))
$AdminUsername = "admin_$(New-HexSecret 3)"
$AdminPassword = New-HexSecret 16
$AdminEmail = "admin@example.invalid"

# Update appsettings.Secrets.json
$AppSettings = Get-Content -Raw $AppSettingsTarget | ConvertFrom-Json
$AppSettings.JwtOptions.Secret = $JwtSecret
$AppSettings.JwtOptions.ConsumerSecret = $ConsumerSecret
$AppSettings.DbOptions.UserId = $DbUser
$AppSettings.DbOptions.Password = $DbPassword
$AppSettings.DbOptions.Name = "carcare"
$AppSettings | ConvertTo-Json -Depth 10 | Set-Content $AppSettingsTarget

# Update .env
(Get-Content $EnvTarget) -replace '^SERVER_SECRET=.*', "SERVER_SECRET=$ConsumerSecret" |
                        ForEach-Object {$_ -replace '^SESSION_SECRET=.*', "SESSION_SECRET=$SessionSecret"} |
    Set-Content $EnvTarget

@"
POSTGRES_USER=$DbUser
POSTGRES_PASSWORD=$DbPassword
POSTGRES_DB=carcare
WEB_PORT=3000
CARCARE_ADMIN_USERNAME=$AdminUsername
CARCARE_ADMIN_PASSWORD=$AdminPassword
CARCARE_ADMIN_EMAIL=$AdminEmail
"@ | Set-Content $DockerEnvTarget

@"
CarCare local credentials
=========================
Application username: $AdminUsername
Application password: $AdminPassword
Database username: $DbUser
Database password: $DbPassword
"@ | Set-Content $CredentialsTarget

Write-Host "Secrets generated and applied to:"
Write-Host "  - $AppSettingsTarget"
Write-Host "  - $EnvTarget"
Write-Host "  - $DockerEnvTarget"
Write-Host "Local login details were written to the ignored file: $CredentialsTarget"
