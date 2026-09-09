using System;
using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.Database;
using Npgsql;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// DbUp, the API and the multi-tenancy driver all build their own connection string. These tests
/// pin the shared TLS behaviour so the three cannot drift apart, and so an unusable SSL mode fails
/// at startup instead of quietly connecting with weaker protection.
/// </summary>
public sealed class PostgresTlsTests
{
    private static NpgsqlConnectionStringBuilder BaseBuilder() => new()
    {
        Host = "db.example.invalid",
        Port = 5432,
        Username = "carcare_test",
        Password = "not-a-real-password",
        Database = "carcare",
    };

    [Fact]
    public void LeavesTheConnectionUntouchedWhenNoTlsSettingsAreConfigured()
    {
        var options = new DbOptions { Host = "db.example.invalid", Port = 5432, Name = "carcare" };
        var expected = BaseBuilder().ToString();

        var actual = PostgresTls.Apply(BaseBuilder(), options).ToString();

        Assert.Equal(expected, actual);
        Assert.DoesNotContain("SSL Mode", actual, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("Root Certificate", actual, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void TreatsEmptyTlsSettingsAsAbsent()
    {
        var options = new DbOptions { SslMode = "   ", RootCertificate = "" };
        var expected = BaseBuilder().ToString();

        Assert.Equal(expected, PostgresTls.Apply(BaseBuilder(), options).ToString());
    }

    [Fact]
    public void AppliesVerifiedTlsAndRootCertificate()
    {
        var options = new DbOptions
        {
            SslMode = "VerifyFull",
            RootCertificate = "/certs/prod-ca-2021.crt",
        };

        var builder = PostgresTls.Apply(BaseBuilder(), options);

        Assert.Equal(SslMode.VerifyFull, builder.SslMode);
        Assert.Equal("/certs/prod-ca-2021.crt", builder.RootCertificate);

        // Assert on the rendered string without pinning Npgsql's exact spelling of the mode.
        var connectionString = builder.ToString();
        Assert.Contains("SSL Mode", connectionString, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Verify", connectionString, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("/certs/prod-ca-2021.crt", connectionString);
        // Verification must never be traded away for convenience.
        Assert.DoesNotContain("Trust Server Certificate=true", connectionString, StringComparison.OrdinalIgnoreCase);
    }

    [Theory]
    [InlineData("verifyfull")]
    [InlineData("VERIFYFULL")]
    public void AcceptsTheModeRegardlessOfCasing(string configured)
    {
        Assert.Equal(SslMode.VerifyFull, PostgresTls.ParseSslMode(configured));
    }

    [Theory]
    [InlineData("une-valeur-invalide")]
    [InlineData("verify_full")]
    [InlineData("")]
    [InlineData("999")]
    public void RejectsAnUnsupportedModeInsteadOfDowngrading(string configured)
    {
        var error = Assert.Throws<InvalidOperationException>(() => PostgresTls.ParseSslMode(configured));

        Assert.Contains("DbOptions:SslMode", error.Message);
        Assert.Contains("VerifyFull", error.Message);
    }

    [Fact]
    public void AnInvalidModeFailsWhenApplied()
    {
        var options = new DbOptions { SslMode = "not-a-mode" };

        Assert.Throws<InvalidOperationException>(() => PostgresTls.Apply(BaseBuilder(), options));
    }
}
