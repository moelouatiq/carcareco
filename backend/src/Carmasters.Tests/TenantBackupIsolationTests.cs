using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ClosedXML.Excel;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// Signs both tenants in once for the whole class. xUnit builds a fresh test instance per test,
/// and /api/users/authenticate allows ten calls a minute, so signing in per test would trip the
/// rate limiter rather than test anything.
/// </summary>
public sealed class TwoTenantsFixture : IAsyncLifetime
{
    public HttpClient Client { get; private set; } = null!;
    public string AlphaJwt { get; private set; } = string.Empty;
    public string BetaJwt { get; private set; } = string.Empty;
    public string AlphaMarker { get; private set; } = string.Empty;
    public string BetaMarker { get; private set; } = string.Empty;
    public string AlphaUser { get; private set; } = string.Empty;

    /// <summary>
    /// Required rather than optional: a test that quietly passes when its environment is missing
    /// proves nothing.
    /// </summary>
    internal static string Required(string name) =>
        Environment.GetEnvironmentVariable(name)
        ?? throw new InvalidOperationException(
            $"{name} is required. Start the stack with docker-compose.tenants-test.yml.");

    public async Task InitializeAsync()
    {
        Client = new HttpClient { BaseAddress = new Uri(Required("CARCARE_TEST_TENANCY_API_URL")) };
        AlphaMarker = Required("CARCARE_TEST_TENANT_A_MARKER");
        BetaMarker = Required("CARCARE_TEST_TENANT_B_MARKER");
        AlphaUser = Required("CARCARE_TEST_TENANT_A_USER");

        var password = Required("CARCARE_TEST_TENANT_PASSWORD");
        AlphaJwt = await SignIn(AlphaUser, password);
        BetaJwt = await SignIn(Required("CARCARE_TEST_TENANT_B_USER"), password);
    }

    public Task DisposeAsync()
    {
        Client?.Dispose();
        return Task.CompletedTask;
    }

    private async Task<string> SignIn(string username, string password)
    {
        using var response = await Client.PostAsJsonAsync("/api/users/authenticate", new
        {
            username,
            password,
            serverSecret = Required("SERVER_SECRET"),
        });
        Assert.True(
            response.IsSuccessStatusCode,
            $"Authentication for {username} failed with HTTP {(int)response.StatusCode}.");

        var session = await response.Content.ReadFromJsonAsync<JsonElement>();
        return session.GetProperty("jwt").GetString()
            ?? throw new InvalidOperationException("No JWT in the authentication response.");
    }
}

/// <summary>
/// Proves the backup cannot cross a tenant boundary, against a running API with multi-tenancy on.
/// </summary>
/// <remarks>
/// The reasoning behind the endpoint is that scope comes from the database the session is bound
/// to, and that database is chosen from the authenticated principal's Spn claim. That is an
/// argument, not evidence, so this reads one tenant's workbook while looking for a marker that
/// only ever existed in another tenant's database.
///
/// It matters even though the deployed configuration currently runs with MultiTenancy disabled:
/// it locks the behaviour in before that changes.
///
/// The two tenants are provisioned by the stack rather than through /api/demo/setup, which is
/// deliberately limited to a single call per day and could only ever have created one of them.
/// docker-compose.tenants-test.yml builds that environment and passes the names in; the class
/// carries the Integration trait, so the CI unit run skips it as it does the other API tests.
/// </remarks>
[Trait("Category", "Integration")]
public sealed class TenantBackupIsolationTests : IClassFixture<TwoTenantsFixture>
{
    private const string BackupPath = "/api/backup/excel";

    private readonly TwoTenantsFixture tenants;

    public TenantBackupIsolationTests(TwoTenantsFixture tenants) => this.tenants = tenants;

    private HttpClient client => tenants.Client;
    private string alphaJwt => tenants.AlphaJwt;
    private string betaJwt => tenants.BetaJwt;
    private string alphaMarker => tenants.AlphaMarker;
    private string betaMarker => tenants.BetaMarker;

    [Fact]
    public async Task OneTenantsBackupNeverContainsAnotherTenantsData()
    {
        using var alphaWorkbook = await DownloadBackup(alphaJwt);
        var alpha = AllText(alphaWorkbook);

        Assert.Contains(alphaMarker, alpha);
        Assert.DoesNotContain(betaMarker, alpha);

        // The other direction too, so the first result cannot be an accident of ordering.
        using var betaWorkbook = await DownloadBackup(betaJwt);
        var beta = AllText(betaWorkbook);

        Assert.Contains(betaMarker, beta);
        Assert.DoesNotContain(alphaMarker, beta);
    }

    [Fact]
    public async Task TheBackupRefusesACallerWithoutASession()
    {
        using var response = await client.GetAsync(BackupPath);

        Assert.True(
            response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden,
            $"Expected the backup to be refused, got HTTP {(int)response.StatusCode}.");
    }

    [Fact]
    public async Task TheOldDatabaseDumpRouteIsGone()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/options/dbdump");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", alphaJwt);

        using var response = await client.SendAsync(request);

        // A 200 here would mean a raw database dump is still reachable by any signed-in user.
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task TheBackupArrivesAsASpreadsheetNamedForTheDayItWasTaken()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, BackupPath);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", alphaJwt);

        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        Assert.Equal(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("attachment", response.Content.Headers.ContentDisposition?.DispositionType);

        var name = response.Content.Headers.ContentDisposition?.FileNameStar
                   ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"');
        Assert.NotNull(name);
        Assert.Matches(@"^Sauvegarde_Garage_\d{4}-\d{2}-\d{2}_\d{4}\.xlsx$", name);
    }

    [Fact]
    public async Task TheBackupCarriesTheTenantsOwnRecordsAndEverySheet()
    {
        using var workbook = await DownloadBackup(alphaJwt);

        Assert.Equal(
            new[]
            {
                "Résumé", "Clients", "Véhicules", "Interventions", "Activités", "Devis",
                "Factures", "Lignes atelier", "Lignes documents", "Stock", "Employés",
                "Paramètres",
            },
            workbook.Worksheets.Select(x => x.Name).ToArray());

        // The seeded rows came back, so the reader's joins really do return data.
        Assert.Contains(alphaMarker, SheetText(workbook.Worksheet("Clients")));
        Assert.Contains(alphaMarker, SheetText(workbook.Worksheet("Véhicules")));
        Assert.Contains(alphaMarker, SheetText(workbook.Worksheet("Paramètres")));
    }

    [Fact]
    public async Task NoSheetCarriesAnythingFromTheAccountsTable()
    {
        using var workbook = await DownloadBackup(alphaJwt);

        var everything = AllText(workbook).ToLowerInvariant();

        // public."user" holds the password hash and the stored avatar; none of it belongs here.
        Assert.DoesNotContain("$2a$", everything);
        Assert.DoesNotContain("$2b$", everything);
        Assert.DoesNotContain("password", everything);
        Assert.DoesNotContain(tenants.AlphaUser.ToLowerInvariant(), everything);
    }

    // ---- helpers -----------------------------------------------------------------------------

    private async Task<XLWorkbook> DownloadBackup(string jwt)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, BackupPath);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return new XLWorkbook(new MemoryStream(await response.Content.ReadAsByteArrayAsync()));
    }

    /// <summary>Every string in the file, so a leak cannot hide in a column nobody thought of.</summary>
    private static string AllText(XLWorkbook workbook)
    {
        var text = new StringBuilder();
        foreach (var sheet in workbook.Worksheets) AppendCells(sheet, text);
        return text.ToString();
    }

    private static string SheetText(IXLWorksheet sheet)
    {
        var text = new StringBuilder();
        AppendCells(sheet, text);
        return text.ToString();
    }

    private static void AppendCells(IXLWorksheet sheet, StringBuilder text)
    {
        foreach (var cell in sheet.CellsUsed()) text.AppendLine(cell.GetString());
    }
}
