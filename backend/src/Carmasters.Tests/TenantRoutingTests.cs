using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.Database;
using Xunit;

namespace Carmasters.Tests;

public sealed class TenantRoutingTests
{
    private static readonly DbOptions Options = new()
    {
        Name = "carcare",
        MultiTenancy = new DbOptions.MultiTenancyOptions
        {
            Enabled = true,
            Suffix = new DbOptions.MultiTenancyOptions.SuffixOptions
            {
                Template = "template",
                Tenancy = "tenancy",
            },
        },
    };

    [Fact]
    public void DifferentTenantClaimsResolveToDifferentDatabaseNames()
    {
        var first = new MultiTenancyDbName(Options, "garage-one").Value;
        var second = new MultiTenancyDbName(Options, "garage-two").Value;

        Assert.Equal("carcare-garage-one", first);
        Assert.Equal("carcare-garage-two", second);
        Assert.NotEqual(first, second);
    }

    [Theory]
    [InlineData("../postgres")]
    [InlineData("tenant;DROP DATABASE postgres")]
    [InlineData("tenant/name")]
    public void UnsafeTenantClaimCannotBecomeADatabaseName(string tenant)
    {
        Assert.Throws<ArgumentException>(() => new MultiTenancyDbName(Options, tenant));
    }
}
