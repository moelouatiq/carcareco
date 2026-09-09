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
    public async Task TamperingWithTenantClaimCannotReadTenantHistoryOrDocuments()
    {
        using var client = CreateTamperedTenantClient();
        using var historyResponse = await client.GetAsync($"/api/servicehistory/clients/{Guid.NewGuid()}");
        using var pdfResponse = await client.GetAsync($"/api/pricings/invoice/{Guid.NewGuid()}/pdf");

        Assert.Equal(HttpStatusCode.Unauthorized, historyResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, pdfResponse.StatusCode);
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

        // The estimate PDF must follow the same French convention as the invoice, driven by the
        // estimate's own business number -- not by the offer or work GUID in the route.
        using (var estimatePdfResponse = await fixture.AuthorizedClient.GetAsync($"/api/pricings/offer/{offerId}/pdf"))
        {
            Assert.Equal(HttpStatusCode.OK, estimatePdfResponse.StatusCode);
            Assert.Equal("application/pdf", estimatePdfResponse.Content.Headers.ContentType?.MediaType);
            Assert.Equal("inline", estimatePdfResponse.Content.Headers.ContentDisposition?.DispositionType);
            // An estimate's business number is composite -- "{work number}-{offer order}", built in
            // Offer.Issue -- so a real estimate is devis_6-0.pdf, not devis_6.pdf.
            Assert.Matches(
                "^devis_[0-9]+-[0-9]+\\.pdf$",
                estimatePdfResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"'));
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

        // The printable HTML is what the /print/invoice route renders and what Puppeteer turns into
        // the PDF. Assert on its content: a template that fails to render is swallowed into the
        // string "render error", which a PDF magic-number check alone would happily accept.
        using (var htmlResponse = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{workId}/html"))
        {
            Assert.Equal(HttpStatusCode.OK, htmlResponse.StatusCode);
            var invoiceHtml = await htmlResponse.Content.ReadAsStringAsync();
            Assert.DoesNotContain("render error", invoiceHtml, StringComparison.OrdinalIgnoreCase);
            Assert.Contains("Diagnostic labour", invoiceHtml);
            // Rendered by the Print/LeftTop.Invoice partial, which the template picks by runtime
            // type name -- the exact partial a lazy proxy silently breaks.
            Assert.Contains("Échéance", invoiceHtml);
            // The printed document is French end to end.
            Assert.Contains("Net à payer", invoiceHtml);
            Assert.Contains("Désignation", invoiceHtml);
            Assert.DoesNotContain("To pay", invoiceHtml);
            Assert.DoesNotContain("Due date", invoiceHtml);

            // Currency and number format: the document must be MAD end to end, in fr-FR format.
            // "250,00" is the 250.00 unit price of the line above: a decimal comma proves the
            // template no longer falls back to the container's InvariantCulture.
            Assert.Contains("MAD", invoiceHtml);
            Assert.Contains("250,00", invoiceHtml);
            Assert.DoesNotContain("250.00", invoiceHtml);
            Assert.DoesNotContain("EUR", invoiceHtml);
            Assert.DoesNotContain("€", invoiceHtml);
            Assert.DoesNotContain("&#x20AC", invoiceHtml, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("&euro;", invoiceHtml, StringComparison.OrdinalIgnoreCase);
        }

        using var pdfResponse = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{workId}/pdf");
        Assert.Equal(HttpStatusCode.OK, pdfResponse.StatusCode);
        Assert.Equal("application/pdf", pdfResponse.Content.Headers.ContentType?.MediaType);
        Assert.Equal("inline", pdfResponse.Content.Headers.ContentDisposition?.DispositionType);
        Assert.Matches("^facture_[0-9]+\\.pdf$", pdfResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"'));
        var pdf = await pdfResponse.Content.ReadAsByteArrayAsync();
        Assert.True(pdf.Length > 1_000, "Generated PDF was unexpectedly small.");
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(pdf, 0, 5));

        using var downloadResponse = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{workId}/pdf/download");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal("application/pdf", downloadResponse.Content.Headers.ContentType?.MediaType);
        Assert.Equal("attachment", downloadResponse.Content.Headers.ContentDisposition?.DispositionType);
        Assert.Matches("^facture_[0-9]+\\.pdf$", downloadResponse.Content.Headers.ContentDisposition?.FileName?.Trim('"'));
        var downloadedPdf = await downloadResponse.Content.ReadAsByteArrayAsync();
        Assert.True(downloadedPdf.Length > 1_000, "Downloaded PDF was unexpectedly small.");
        Assert.Equal("%PDF-", Encoding.ASCII.GetString(downloadedPdf, 0, 5));
        Assert.DoesNotContain("jwt", downloadResponse.RequestMessage!.RequestUri!.Query.ToLowerInvariant());

        var allWork = await GetWorkPage(
            $"issued=off&status=all&workFrom=&workTo=&searchText={Uri.EscapeDataString($"Test-{suffix} Client")}&limit=30&offset=0");
        Assert.Contains(WorkItems(allWork), item => item.GetProperty("id").GetGuid() == workId);

        var unfinishedWork = await GetWorkPage("issued=off&status=unfinished&limit=30&offset=0");
        Assert.DoesNotContain(WorkItems(unfinishedWork), item => item.GetProperty("id").GetGuid() == workId);
    }

    [Fact]
    public async Task WorkPageHonorsAllUnfinishedSearchIdentifiersAndEmptyDates()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var firstName = $"History-{suffix}";
        const string lastName = "Client";
        var registration = $"H-{suffix[..7]}";
        var clientId = await PostGuid("/api/privateclients", new
        {
            firstName,
            lastName,
            address = new
            {
                street = "20 History Street",
                country = "MA",
                region = "Casablanca-Settat",
                city = "Casablanca",
                postalCode = "20000",
            },
            phone = "+212600000001",
            emailAddresses = new[] { $"history-{suffix}@example.invalid" },
            currentEmail = $"history-{suffix}@example.invalid",
            isAsshole = false,
            description = "Work history filter regression test",
            personalCode = $"HC-{suffix}",
            introducedAt = DateTime.UtcNow,
        });
        var vehicleId = await PostGuid("/api/vehicles", new
        {
            producer = "Renault",
            model = "Clio",
            regNr = registration,
            vin = $"HISTORYVIN{suffix}",
            odo = 200,
            ownerId = clientId,
            description = "Work history filter regression test",
        });
        var workId = await PostWork(clientId, vehicleId, "Work history filter regression test");

        var noFilter = await GetWorkPage("limit=30&offset=0");
        Assert.Contains(WorkItems(noFilter), item => item.GetProperty("id").GetGuid() == workId);

        var allWithEmptyValues = await GetWorkPage(
            "issued=off&status=all&workFrom=&workTo=&clientId%5Bvalue%5D=&vehicleId%5Bvalue%5D=&limit=30&offset=0");
        Assert.Contains(WorkItems(allWithEmptyValues), item => item.GetProperty("id").GetGuid() == workId);

        var unfinished = await GetWorkPage("issued=off&status=unfinished&limit=30&offset=0");
        Assert.Contains(WorkItems(unfinished), item => item.GetProperty("id").GetGuid() == workId);
        Assert.All(WorkItems(unfinished), item =>
            Assert.True(item.GetProperty("status").GetString() is "default" or "inprogress"));

        var byClient = await GetWorkPage(
            $"issued=off&status=all&searchText={Uri.EscapeDataString($"{firstName} {lastName}")}&limit=30&offset=0");
        Assert.Contains(WorkItems(byClient), item => item.GetProperty("id").GetGuid() == workId);

        var byVehicle = await GetWorkPage(
            $"issued=off&status=all&searchText={Uri.EscapeDataString(registration)}&limit=30&offset=0");
        Assert.Contains(WorkItems(byVehicle), item => item.GetProperty("id").GetGuid() == workId);

        var byClientId = await GetWorkPage(
            $"issued=off&status=all&clientId%5Bvalue%5D={clientId:D}&limit=30&offset=0");
        Assert.Contains(WorkItems(byClientId), item => item.GetProperty("id").GetGuid() == workId);

        var byVehicleId = await GetWorkPage(
            $"issued=off&status=all&vehicleId%5Bvalue%5D={vehicleId:D}&limit=30&offset=0");
        Assert.Contains(WorkItems(byVehicleId), item => item.GetProperty("id").GetGuid() == workId);

        using (var closeResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/{workId}/status/Closed", new { }))
        {
            Assert.Equal(HttpStatusCode.OK, closeResponse.StatusCode);
        }

        var unfinishedAfterClose = await GetWorkPage("issued=off&status=unfinished&limit=30&offset=0");
        Assert.DoesNotContain(WorkItems(unfinishedAfterClose), item => item.GetProperty("id").GetGuid() == workId);

        var allAfterClose = await GetWorkPage("issued=off&status=all&limit=30&offset=0");
        Assert.Contains(WorkItems(allAfterClose), item => item.GetProperty("id").GetGuid() == workId);

        var trulyEmpty = await GetWorkPage(
            $"issued=off&status=all&searchText={Guid.NewGuid():N}&limit=30&offset=0");
        Assert.Empty(WorkItems(trulyEmpty));
    }

    [Fact]
    public async Task ServiceHistoryReturnsClientAndVehicleDataWithPaginationAndOfficialInvoiceTotals()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var clientId = await CreatePrivateClient($"Service-{suffix}", "History");
        var firstVehicleId = await CreateVehicle(clientId, $"SH-A-{suffix[..5]}", $"SERVICEA{suffix}");
        var secondVehicleId = await CreateVehicle(clientId, $"SH-B-{suffix[..5]}", $"SERVICEB{suffix}");

        var invoicedWork = await PostWorkWithActivity(
            clientId,
            firstVehicleId,
            "Inspection and oil service",
            101);
        using (var linesResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/repairjob/{invoicedWork.ActivityId}/productsorservices",
            new[]
            {
                new { id = Guid.Empty, code = "", name = "Inspection labour", quantity = 1, unit = "hour", price = 120m, discount = 0 },
                new { id = Guid.Empty, code = "FILTER", name = "Oil filter", quantity = 1, unit = "part", price = 60m, discount = 0 },
            }))
        {
            Assert.Equal(HttpStatusCode.OK, linesResponse.StatusCode);
        }
        using (var invoiceResponse = await fixture.AuthorizedClient.PutAsJsonAsync(
            $"/api/work/{invoicedWork.WorkId}/invoice/issue",
            new { paymentType = 1, dueDays = 14, sendClientEmail = false, clientEmail = "" }))
        {
            Assert.Equal(HttpStatusCode.OK, invoiceResponse.StatusCode);
        }

        var secondVehicleWork = await PostWorkWithActivity(
            clientId,
            secondVehicleId,
            "Tyre inspection",
            202);
        var latestWork = await PostWorkWithActivity(
            clientId,
            firstVehicleId,
            "Brake inspection",
            303);

        var firstPage = await GetJson(
            $"/api/servicehistory/clients/{clientId}?offset=0&limit=2");
        var secondPage = await GetJson(
            $"/api/servicehistory/clients/{clientId}?offset=2&limit=2");

        Assert.Equal(3, firstPage.GetProperty("totalCount").GetInt32());
        Assert.Equal(180m, firstPage.GetProperty("totalInvoiced").GetDecimal());
        Assert.True(firstPage.GetProperty("hasMore").GetBoolean());
        Assert.False(secondPage.GetProperty("hasMore").GetBoolean());

        var clientItems = firstPage.GetProperty("items").EnumerateArray()
            .Concat(secondPage.GetProperty("items").EnumerateArray())
            .ToArray();
        Assert.Equal(3, clientItems.Length);
        Assert.Equal(
            new[] { latestWork.WorkId, secondVehicleWork.WorkId, invoicedWork.WorkId },
            clientItems.Select(item => item.GetProperty("workId").GetGuid()).ToArray());
        Assert.Equal(2, clientItems.Select(item => item.GetProperty("vehicleId").GetGuid()).Distinct().Count());
        var openedOn = clientItems.Select(item => item.GetProperty("openedOn").GetDateTimeOffset()).ToArray();
        Assert.Equal(openedOn.OrderByDescending(value => value).ToArray(), openedOn);

        var invoiceItem = clientItems.Single(item => item.GetProperty("workId").GetGuid() == invoicedWork.WorkId);
        Assert.True(invoiceItem.GetProperty("hasInvoice").GetBoolean());
        Assert.Equal(180m, invoiceItem.GetProperty("totalAmount").GetDecimal());
        Assert.Equal("MAD", invoiceItem.GetProperty("currency").GetString());
        // The application is single-currency: every row must carry MAD, invoiced or not.
        Assert.All(clientItems, item => Assert.Equal("MAD", item.GetProperty("currency").GetString()));
        Assert.NotEqual(Guid.Empty, invoiceItem.GetProperty("invoiceId").GetGuid());
        Assert.True(invoiceItem.GetProperty("invoiceNumber").GetInt32() > 0);
        Assert.Equal("Inspection labour", invoiceItem.GetProperty("labor")[0].GetProperty("name").GetString());
        Assert.Equal("Oil filter", invoiceItem.GetProperty("parts")[0].GetProperty("name").GetString());

        var uninvoicedItem = clientItems.Single(item => item.GetProperty("workId").GetGuid() == latestWork.WorkId);
        Assert.False(uninvoicedItem.GetProperty("hasInvoice").GetBoolean());
        Assert.Equal(JsonValueKind.Null, uninvoicedItem.GetProperty("invoiceId").ValueKind);
        Assert.Equal(JsonValueKind.Null, uninvoicedItem.GetProperty("totalAmount").ValueKind);

        var vehicleHistory = await GetJson(
            $"/api/servicehistory/vehicles/{firstVehicleId}?offset=0&limit=10");
        Assert.Equal(2, vehicleHistory.GetProperty("totalCount").GetInt32());
        Assert.Equal(303, vehicleHistory.GetProperty("lastRecordedOdometer").GetInt32());
        Assert.Equal(180m, vehicleHistory.GetProperty("totalInvoiced").GetDecimal());
        var vehicleItems = vehicleHistory.GetProperty("items").EnumerateArray().ToArray();
        Assert.Equal(new[] { 303, 101 }, vehicleItems.Select(item => item.GetProperty("odometer").GetInt32()).ToArray());
        Assert.Contains(vehicleItems, item => item.GetProperty("hasInvoice").GetBoolean());
        Assert.Contains(vehicleItems, item => !item.GetProperty("hasInvoice").GetBoolean());
    }

    [Fact]
    public async Task ServiceHistoryHandlesEmptyMissingInvalidAndAnonymousRequests()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var emptyClientId = await CreatePrivateClient($"Empty-{suffix}", "History");
        var emptyVehicleId = await CreateVehicle(emptyClientId, $"EMPTY-{suffix[..5]}", $"EMPTYVIN{suffix}");

        var clientHistory = await GetJson($"/api/servicehistory/clients/{emptyClientId}");
        var vehicleHistory = await GetJson($"/api/servicehistory/vehicles/{emptyVehicleId}");
        Assert.Equal(0, clientHistory.GetProperty("totalCount").GetInt32());
        Assert.Empty(clientHistory.GetProperty("items").EnumerateArray());
        Assert.Equal(0, vehicleHistory.GetProperty("totalCount").GetInt32());
        Assert.Empty(vehicleHistory.GetProperty("items").EnumerateArray());

        using var invalidClient = await fixture.AuthorizedClient.GetAsync("/api/servicehistory/clients/not-a-guid");
        using var invalidVehicle = await fixture.AuthorizedClient.GetAsync("/api/servicehistory/vehicles/not-a-guid");
        using var invalidPagination = await fixture.AuthorizedClient.GetAsync($"/api/servicehistory/clients/{emptyClientId}?offset=-1&limit=51");
        using var missingClient = await fixture.AuthorizedClient.GetAsync($"/api/servicehistory/clients/{Guid.NewGuid()}");
        using var missingVehicle = await fixture.AuthorizedClient.GetAsync($"/api/servicehistory/vehicles/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.BadRequest, invalidClient.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidVehicle.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidPagination.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingClient.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingVehicle.StatusCode);

        using var anonymousClient = new HttpClient { BaseAddress = fixture.BaseAddress };
        using var anonymousHistory = await anonymousClient.GetAsync($"/api/servicehistory/clients/{emptyClientId}");
        using var anonymousPdf = await anonymousClient.GetAsync($"/api/pricings/invoice/{Guid.NewGuid()}/pdf");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousHistory.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousPdf.StatusCode);
    }

    [Fact]
    public async Task InvoicePdfReturnsNotFoundForWorkWithoutInvoiceAndMissingWork()
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        var clientId = await CreatePrivateClient($"NoInvoice-{suffix}", "History");
        var vehicleId = await CreateVehicle(clientId, $"NOINV-{suffix[..5]}", $"NOINVOICE{suffix}");
        var work = await PostWorkWithActivity(clientId, vehicleId, "Not invoiced", 404);

        using var absentInvoice = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{work.WorkId}/pdf");
        using var absentDownload = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{work.WorkId}/pdf/download");
        using var missingWork = await fixture.AuthorizedClient.GetAsync($"/api/pricings/invoice/{Guid.NewGuid()}/pdf");
        using var invalidWork = await fixture.AuthorizedClient.GetAsync("/api/pricings/invoice/not-a-guid/pdf");

        Assert.Equal(HttpStatusCode.NotFound, absentInvoice.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, absentDownload.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missingWork.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidWork.StatusCode);
    }

    private async Task<Guid> PostGuid(string path, object body)
    {
        using var response = await fixture.AuthorizedClient.PostAsJsonAsync(path, body);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var id = await response.Content.ReadFromJsonAsync<Guid>(JsonOptions);
        Assert.NotEqual(Guid.Empty, id);
        return id;
    }

    private Task<Guid> CreatePrivateClient(string firstName, string lastName)
    {
        var suffix = Guid.NewGuid().ToString("N")[..10];
        return PostGuid("/api/privateclients", new
        {
            firstName,
            lastName,
            address = new
            {
                street = "30 Service History Street",
                country = "MA",
                region = "Casablanca-Settat",
                city = "Casablanca",
                postalCode = "20000",
            },
            phone = "+212600000002",
            emailAddresses = new[] { $"service-history-{suffix}@example.invalid" },
            currentEmail = $"service-history-{suffix}@example.invalid",
            isAsshole = false,
            description = "Service history integration test",
            personalCode = $"SH-{suffix}",
            introducedAt = DateTime.UtcNow,
        });
    }

    private Task<Guid> CreateVehicle(Guid clientId, string registration, string vin) =>
        PostGuid("/api/vehicles", new
        {
            producer = "Renault",
            model = "Clio",
            regNr = registration,
            vin,
            odo = 0,
            ownerId = clientId,
            description = "Service history integration test",
        });

    private async Task<Guid> PostWork(Guid clientId, Guid vehicleId, string description)
    {
        return (await PostWorkWithActivity(clientId, vehicleId, description, 201)).WorkId;
    }

    private async Task<(Guid WorkId, Guid ActivityId)> PostWorkWithActivity(
        Guid clientId,
        Guid vehicleId,
        string description,
        int odometer)
    {
        using var response = await fixture.AuthorizedClient.PostAsJsonAsync("/api/work", new
        {
            clientId,
            description,
            vehicleId,
            assignedTo = Array.Empty<Guid>(),
            odo = odometer,
            startWithOffer = false,
        });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var work = await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
        var workId = work.GetProperty("workId").GetGuid();
        var activityId = work.GetProperty("activityId").GetGuid();
        Assert.NotEqual(Guid.Empty, workId);
        Assert.NotEqual(Guid.Empty, activityId);
        return (workId, activityId);
    }

    private async Task<JsonElement> GetJson(string path)
    {
        using var response = await fixture.AuthorizedClient.GetAsync(path);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
    }

    private async Task<JsonElement> GetWorkPage(string query)
    {
        using var response = await fixture.AuthorizedClient.GetAsync($"/api/work/page?{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await response.Content.ReadFromJsonAsync<JsonElement>(JsonOptions);
    }

    private static JsonElement[] WorkItems(JsonElement page) =>
        page.GetProperty("items").EnumerateArray().ToArray();

    private HttpClient CreateTamperedTenantClient()
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

        var client = new HttpClient { BaseAddress = fixture.BaseAddress };
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tamperedToken);
        return client;
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
