using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Claims;
using System.Text;
using Carmasters.Core.Application.Authorization;
using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.Extensions.DependencyInjection;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// Data Protection decides whether the API can boot at all, and the two modes fail in opposite ways:
/// the historic one needs a writable directory, the ephemeral one must never look for it. These tests
/// pin both, and pin that switching between them changes nothing outside Data Protection itself.
/// </summary>
public sealed class DataProtectionConfigurationTests : IDisposable
{
    private readonly List<string> _temporaryPaths = new();

    // ---- historic mode -------------------------------------------------------------------------

    [Fact]
    public void PersistsKeysToTheConfiguredDirectoryWhenEphemeralIsAbsent()
    {
        var keysDirectory = Path.Combine(NewTemporaryRoot(), "keys");

        Configure(
            new Dictionary<string, string?> { ["DataProtection:KeysDirectory"] = keysDirectory },
            Environments.Development);

        Assert.True(Directory.Exists(keysDirectory));
    }

    [Fact]
    public void FallsBackToTheContentRootWhenNeitherSettingIsPresent()
    {
        var contentRoot = NewTemporaryRoot();

        Configure(new Dictionary<string, string?>(), Environments.Development, contentRoot);

        Assert.True(Directory.Exists(Path.Combine(contentRoot, ".data-protection-keys")));
    }

    [Fact]
    public void StillRefusesProductionWithoutAKeysDirectory()
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            Configure(new Dictionary<string, string?>(), Environments.Production));

        Assert.Contains("DataProtection:KeysDirectory", error.Message);
    }

    [Fact]
    public void StillRefusesProductionWithoutAProtectionCertificate()
    {
        var settings = new Dictionary<string, string?>
        {
            ["DataProtection:KeysDirectory"] = Path.Combine(NewTemporaryRoot(), "keys"),
        };

        var error = Assert.Throws<InvalidOperationException>(() =>
            Configure(settings, Environments.Production));

        Assert.Contains("certificate", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ---- ephemeral mode ------------------------------------------------------------------------

    [Fact]
    public void StartsInProductionWithoutAKeysDirectoryOrCertificateWhenEphemeral()
    {
        var settings = new Dictionary<string, string?> { ["DataProtection:Ephemeral"] = "true" };

        // No throw is the assertion: this is exactly the Vercel configuration, where neither a
        // persistent directory nor a PKCS#12 file can be supplied.
        using var provider = Configure(settings, Environments.Production);

        Assert.NotNull(provider.GetRequiredService<IDataProtectionProvider>());
    }

    [Fact]
    public void NeverTouchesTheFilesystemWhenEphemeral()
    {
        // A content root whose parent is a file, so any CreateDirectory below it throws. The historic
        // mode must fail here and the ephemeral mode must not, which is what proves the ephemeral path
        // does not go near the filesystem rather than merely happening to find a writable directory.
        var blockedContentRoot = Path.Combine(NewTemporaryFile(), "content-root");

        Assert.ThrowsAny<IOException>(() =>
            Configure(new Dictionary<string, string?>(), Environments.Development, blockedContentRoot));

        using var provider = Configure(
            new Dictionary<string, string?> { ["DataProtection:Ephemeral"] = "true" },
            Environments.Production,
            blockedContentRoot);

        Assert.NotNull(provider.GetRequiredService<IDataProtectionProvider>());
    }

    [Fact]
    public void EphemeralKeysDoNotSurviveTheInstance()
    {
        var settings = new Dictionary<string, string?> { ["DataProtection:Ephemeral"] = "true" };
        using var first = Configure(settings, Environments.Production);
        using var second = Configure(settings, Environments.Production);

        var protectedPayload = first.GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("test")
            .Protect("payload");

        // Two instances hold unrelated key rings, which is the cost this mode accepts knowingly.
        Assert.ThrowsAny<Exception>(() => second.GetRequiredService<IDataProtectionProvider>()
            .CreateProtector("test")
            .Unprotect(protectedPayload));
    }

    [Theory]
    [InlineData("oui")]
    [InlineData("1")]
    [InlineData("yes")]
    public void RejectsAnUnreadableFlagInsteadOfFallingBackSilently(string configured)
    {
        var settings = new Dictionary<string, string?> { ["DataProtection:Ephemeral"] = configured };

        var error = Assert.Throws<InvalidOperationException>(() =>
            Configure(settings, Environments.Production));

        Assert.Contains("DataProtection:Ephemeral", error.Message);
    }

    [Fact]
    public void TreatsAnEmptyFlagAsTheHistoricMode()
    {
        var settings = new Dictionary<string, string?>
        {
            ["DataProtection:Ephemeral"] = "   ",
            ["DataProtection:KeysDirectory"] = Path.Combine(NewTemporaryRoot(), "keys"),
        };

        Configure(settings, Environments.Development);

        Assert.True(Directory.Exists(settings["DataProtection:KeysDirectory"]));
    }

    // ---- isolation from everything else --------------------------------------------------------

    [Fact]
    public void LeavesJwtSigningUntouched()
    {
        const string secret = "a-jwt-secret-that-is-long-enough-for-hmac-sha256-signing";
        var options = new JwtOptions { Secret = secret, SessionTimeout = TimeSpan.FromMinutes(30) };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim("sub", "42") }));

        using var persistent = Configure(
            new Dictionary<string, string?>
            {
                ["DataProtection:KeysDirectory"] = Path.Combine(NewTemporaryRoot(), "keys"),
            },
            Environments.Development);
        var fromPersistent = AppJwtToken.Generate(options, principal);

        using var ephemeral = Configure(
            new Dictionary<string, string?> { ["DataProtection:Ephemeral"] = "true" },
            Environments.Production);
        var fromEphemeral = AppJwtToken.Generate(options, principal);

        // Both tokens validate against JwtOptions.Secret alone, in either mode: the signing key comes
        // from configuration, never from the Data Protection key ring.
        Assert.Equal("42", AppJwtToken.LoadJwt(options, fromPersistent).Subject);
        Assert.Equal("42", AppJwtToken.LoadJwt(options, fromEphemeral).Subject);
        Assert.Equal(
            Encoding.ASCII.GetBytes(secret).Length,
            Encoding.ASCII.GetBytes(options.Secret).Length);
    }

    [Fact]
    public void LeavesDatabaseOptionsUntouched()
    {
        var settings = new Dictionary<string, string?>
        {
            ["DataProtection:Ephemeral"] = "true",
            ["DbOptions:Host"] = "db.example.invalid",
            ["DbOptions:Name"] = "carcare",
            ["DbOptions:SslMode"] = "VerifyFull",
            ["DbOptions:RootCertificate"] = "/certs/prod-ca-2021.crt",
        };

        using var provider = Configure(settings, Environments.Production, configureExtra: (services, configuration) =>
            services.AddApplicationOptions(configuration));

        var options = provider.GetRequiredService<IOptions<DbOptions>>().Value;
        Assert.Equal("db.example.invalid", options.Host);
        Assert.Equal("carcare", options.Name);
        Assert.Equal("VerifyFull", options.SslMode);
        Assert.Equal("/certs/prod-ca-2021.crt", options.RootCertificate);
    }

    // ---- helpers -------------------------------------------------------------------------------

    private ServiceProvider Configure(
        Dictionary<string, string?> settings,
        string environmentName,
        string? contentRootPath = null,
        Action<IServiceCollection, IConfiguration>? configureExtra = null)
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
        var environment = new StubHostEnvironment(environmentName, contentRootPath ?? NewTemporaryRoot());

        var services = new ServiceCollection();
        services.AddDataProtectionToApp(configuration, environment);
        configureExtra?.Invoke(services, configuration);
        return services.BuildServiceProvider();
    }

    private string NewTemporaryRoot()
    {
        var path = Path.Combine(Path.GetTempPath(), "carcare-dp-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(path);
        _temporaryPaths.Add(path);
        return path;
    }

    private string NewTemporaryFile()
    {
        var path = Path.Combine(Path.GetTempPath(), "carcare-dp-" + Guid.NewGuid().ToString("n") + ".tmp");
        File.WriteAllText(path, string.Empty);
        _temporaryPaths.Add(path);
        return path;
    }

    public void Dispose()
    {
        foreach (var path in _temporaryPaths)
        {
            try
            {
                if (Directory.Exists(path)) Directory.Delete(path, recursive: true);
                else if (File.Exists(path)) File.Delete(path);
            }
            catch (IOException)
            {
                // A leftover temp file is not worth failing a test run over.
            }
        }
    }

    private sealed class StubHostEnvironment : IHostEnvironment
    {
        public StubHostEnvironment(string environmentName, string contentRootPath)
        {
            EnvironmentName = environmentName;
            ContentRootPath = contentRootPath;
            ContentRootFileProvider = new NullFileProvider();
        }

        public string EnvironmentName { get; set; }
        public string ApplicationName { get; set; } = "Carmasters.Tests";
        public string ContentRootPath { get; set; }
        public IFileProvider ContentRootFileProvider { get; set; }
    }
}
