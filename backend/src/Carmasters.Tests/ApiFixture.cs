using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace Carmasters.Tests;

public sealed class ApiFixture : IAsyncLifetime
{
    public Uri BaseAddress { get; } = new(RequiredEnvironment("CARCARE_TEST_API_URL"));
    public HttpClient AuthorizedClient { get; private set; } = null!;
    public string Jwt { get; private set; } = string.Empty;

    public async Task InitializeAsync()
    {
        await WaitUntilHealthy();

        using var authenticationClient = new HttpClient { BaseAddress = BaseAddress };
        var response = await authenticationClient.PostAsJsonAsync("/api/users/authenticate", new
        {
            username = RequiredEnvironment("CARCARE_TEST_USERNAME"),
            password = RequiredEnvironment("CARCARE_TEST_PASSWORD"),
            serverSecret = RequiredEnvironment("SERVER_SECRET"),
        });
        Assert.True(response.IsSuccessStatusCode, $"Authentication failed with HTTP {(int)response.StatusCode}.");

        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        Jwt = payload.GetProperty("jwt").GetString()
            ?? throw new InvalidOperationException("Authentication response did not contain a JWT.");
        AuthorizedClient = new HttpClient { BaseAddress = BaseAddress };
        AuthorizedClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Jwt);
    }

    public Task DisposeAsync()
    {
        AuthorizedClient?.Dispose();
        return Task.CompletedTask;
    }

    private async Task WaitUntilHealthy()
    {
        using var healthClient = new HttpClient { BaseAddress = BaseAddress, Timeout = TimeSpan.FromSeconds(3) };
        var deadline = DateTime.UtcNow.AddMinutes(3);

        while (DateTime.UtcNow < deadline)
        {
            try
            {
                using var response = await healthClient.GetAsync("/health");
                if (response.IsSuccessStatusCode) return;
            }
            catch (HttpRequestException)
            {
                // The API container is still starting.
            }
            catch (TaskCanceledException)
            {
                // The API container is still starting.
            }

            await Task.Delay(TimeSpan.FromSeconds(2));
        }

        throw new TimeoutException("The CarCare API did not become healthy within three minutes.");
    }

    private static string RequiredEnvironment(string name)
    {
        var value = Environment.GetEnvironmentVariable(name);
        return string.IsNullOrWhiteSpace(value)
            ? throw new InvalidOperationException($"Required test environment variable {name} is missing.")
            : value;
    }
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFixture>
{
    public const string Name = "CarCare API";
}
