using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Xunit;

namespace Carmasters.Tests;

[Collection(ApiCollection.Name)]
[Trait("Category", "Integration")]
public sealed class ApiSecurityAndBusinessFlowTests(ApiFixture fixture)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [Fact]
    public async Task ProtectedEndpointRejectsAnonymousRequest()
    {
        using var anonymousClient = new HttpClient { BaseAddress = fixture.BaseAddress };
        using var response = await anonymousClient.GetAsync("/api/employees");

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/tailwind.css")]
    [InlineData("/print.css")]
    public async Task OperationalAndStaticResourcesRemainPublic(string path)
    {
        using var anonymousClient = new HttpClient { BaseAddress = fixture.BaseAddress };
        using var response = await anonymousClient.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedRootUserCanReadProtectedEndpoint()
    {
        using var response = await fixture.AuthorizedClient.GetAsync("/api/employees");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task TamperingWithTenantClaimInvalidatesAuthentication()
    {
        var parts = fixture.Jwt.Split('.');
        Assert.Equal(3, parts.Length);
        var payload = JsonNode.Parse(Base64UrlDecode(parts[1]))!.AsObject();
        var tenantClaim = payload.FirstOrDefault(property =>
            property.Key.Equals("spn", StringComparison.OrdinalIgnoreCase)
            || property.Key.EndsWith("/spn", StringComparison.OrdinalIgnoreCase));
        Assert.False(string.IsNullOrWhiteSpace(tenantClaim.Key));
        payload[tenantClaim.Key] = "another-tenant";
        var tamperedToken = $"{parts[0]}.{Base64UrlEncode(payload.ToJsonString())}.{parts[2]}";

        using var client = new HttpClient { BaseAddress = fixture.BaseAddress };
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tamperedToken);
        using var response = await client.GetAsync("/api/employees");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task MissingRequiredLoginFieldsAreRejected()
    {
        using var client = new HttpClient { BaseAddress = fixture.BaseAddress };
        using var response = await client.PostAsJsonAsync("/api/users/authenticate", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CriticalBusinessFlowCreatesClientVehicleWorkOfferInvoiceAndPdf()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var clientId = await PostGuid("/api/privateclients", new
        {
            firstName = $"Test-{suffix}",
            lastName = "Client",
            address = new
            {
                street = "10 Test Street",
                country = "MA",
                region = "Casablanca-Settat",
                city = "Casablanca",
                postalCode = "20000",
            },
            phone = "+212600000000",
            emailAddresses = new[] { $"test-{suffix}@example.invalid" },
            currentEmail = $"test-{suffix}@example.invalid",
            isAsshole = false,
            description = "Automated integration test",
            personalCode = $"PC-{suffix}",
            introducedAt = DateTime.UtcNow,
        });

        using (var mappedClientResponse = await fixture.AuthorizedClient.GetAsync($"/api/privateclients/{clientId}"))
        {
            Assert.Equal(HttpStatusCode.OK, mappedClientResponse.StatusCode);
            var mappedClient = await mappedClientResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            Assert.Equal($"Test-{suffix}", mappedClient.GetProperty("firstName").GetString());
            Assert.Equal("Casablanca", mappedClient.GetProperty("address").GetProperty("city").GetString());
        }

        var vehicleId = await PostGuid("/api/vehicles", new
        {
            producer = "Dacia",
            model = "Logan",
            regNr = $"T-{suffix[..5]}",
            vin = $"TESTVIN{suffix}",
            odo = 100,
            ownerId = clientId,
            description = "Automated integration test",
        });

        using (var vehicleResponse = await fixture.AuthorizedClient.GetAsync($"/api/vehicles/{vehicleId}"))
        {
            Assert.Equal(HttpStatusCode.OK, vehicleResponse.StatusCode);
            var vehicle = await vehicleResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            Assert.Equal(clientId, vehicle.GetProperty("ownerId").GetGuid());
        }

        using var workResponse = await fixture.AuthorizedClient.PostAsJsonAsync("/api/work", new
        {
            clientId,
            description = "Diagnostic and repair",
            vehicleId,
            assignedTo = Array.Empty<Guid>(),
            odo = 101,
            startWithOffer = true,
        });
        Assert.Equal(HttpStatusCode.OK, workResponse.StatusCode);
        var work = await workResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var workId = work.GetProperty("workId").GetGuid();
        var offerId = work.GetProperty("activityId").GetGuid();
        Assert.NotEqual(Guid.Empty, workId);
        Assert.NotEqual(Guid.Empty, offerId);

        using (var productResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/offer/{offerId}/productsorservices",
            new[]
            {
                new { id = Guid.Empty, code = "LAB", name = "Diagnostic labour", quantity = 1, unit = "hour", price = 250m, discount = 0 },
            }))
        {
            Assert.Equal(HttpStatusCode.OK, productResponse.StatusCode);
        }

        using (var issueOfferResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/{workId}/estimate/issue/0",
            new { showVehicleOnPricing = true, sendClientEmail = false, clientEmail = "" }))
        {
            Assert.Equal(HttpStatusCode.OK, issueOfferResponse.StatusCode);
            Assert.NotEqual(Guid.Empty, await issueOfferResponse.Content.ReadFromJsonAsync<Guid>(JsonOptions));
        }

        using (var offerListResponse = await fixture.AuthorizedClient.GetAsync($"/api/pricings/offers/{workId}"))
        {
            Assert.Equal(HttpStatusCode.OK, offerListResponse.StatusCode);
            var offers = await offerListResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            Assert.Equal(1, offers.GetArrayLength());
        }

        Guid repairJobId;
        using (var acceptResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/{workId}/estimate/0/accepted",
            "Accepted by integration test"))
        {
            Assert.Equal(HttpStatusCode.OK, acceptResponse.StatusCode);
            repairJobId = await acceptResponse.Content.ReadFromJsonAsync<Guid>(JsonOptions);
            Assert.NotEqual(Guid.Empty, repairJobId);
        }

        using (var repairProductsResponse = await fixture.AuthorizedClient.GetAsync(
            $"/api/work/repairjob/{repairJobId}/productsorservices"))
        {
            Assert.Equal(HttpStatusCode.OK, repairProductsResponse.StatusCode);
            var products = await repairProductsResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            Assert.Equal(1, products.GetArrayLength());
        }

        using (var invoiceResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/{workId}/invoice/issue",
            new { paymentType = 1, dueDays = 14, sendClientEmail = false, clientEmail = "" }))
        {
            Assert.Equal(HttpStatusCode.OK, invoiceResponse.StatusCode);
        }

        using (var completedWorkResponse = await fixture.AuthorizedClient.GetAsync($"/api/work/{workId}"))
        {
            Assert.Equal(HttpStatusCode.OK, completedWorkResponse.StatusCode);
            var completedWork = await completedWorkResponse.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
            Assert.Equal("completed", completedWork.GetProperty("status").GetString());
            Assert.Equal(JsonValueKind.Object, completedWork.GetProperty("issuance").ValueKind);
        }

        using var pdfResponse = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{workId}/pdf");
        Assert.Equal(HttpStatusCode.OK, pdfResponse.StatusCode);
        Assert.Equal("application/pdf", pdfResponse.Content.Headers.ContentType?.MediaType);
        var pdf = await pdfResponse.Content.ReadAsByteArrayAsync();
        Assert.True(pdf.Length > 1_000, "Generated PDF was unexpectedly small.");
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(pdf, 0, 5));
    }

    private async Task<Guid> PostGuid(string path, object body)
    {
        using var response = await fixture.AuthorizedClient.PostAsJsonAsync(path, body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var id = await response.Content.ReadFromJsonAsync<Guid>(JsonOptions);
        Assert.NotEqual(Guid.Empty, id);
        return id;
    }

    private static string Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + ((4 - padded.Length % 4) % 4), '=');
        return Encoding.UTF8.GetString(Convert.FromBase64String(padded));
    }

    private static string Base64UrlEncode(string value) =>
        Convert.ToBase64String(Encoding.UTF8.GetBytes(value))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
}
