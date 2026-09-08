using Carmasters.Core.Application;
using Carmasters.Core.Domain;
using Carmasters.Http.Api.Models;
using Xunit;

namespace Carmasters.Tests;

public sealed class AppMapperTests
{
    [Fact]
    public void MapsPrivateClientContactDataWithoutRecursiveTraversal()
    {
        var client = new PrivateClient(
            new DateTime(2026, 1, 2, 0, 0, 0, DateTimeKind.Utc),
            "Test",
            "Client",
            new AddressComponent("10 Main Street", "MA", "Casablanca-Settat", "Casablanca", "20000"),
            "+212600000000",
            description: "Integration mapping",
            personalCode: "PC-1");
        client.UsesEmail(["test@example.invalid"], "test@example.invalid");

        var result = new AppMapper().Map<PrivateClientDto>(client);

        Assert.Equal("Test", result.FirstName);
        Assert.Equal("Client", result.LastName);
        Assert.Equal("Casablanca", result.Address.City);
        Assert.Equal("test@example.invalid", result.CurrentEmail);
        Assert.Equal(["test@example.invalid"], result.EmailAddresses);
    }
}
