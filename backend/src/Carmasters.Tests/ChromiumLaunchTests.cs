using System;
using System.IO;
using Carmasters.Core.Application.Services;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// A container host gives Chromium no sandbox to build, a small /dev/shm and no writable disk to
/// download a browser into. These tests pin the two decisions that follow: the launch flags, and the
/// rule that a configured browser is used as configured or not at all.
/// </summary>
public sealed class ChromiumLaunchTests
{
    [Theory]
    [InlineData("--no-sandbox")]
    [InlineData("--disable-setuid-sandbox")]
    [InlineData("--disable-dev-shm-usage")]
    [InlineData("--disable-gpu")]
    public void LaunchesWithTheFlagsAContainerHostRequires(string expected)
    {
        Assert.Contains(expected, PdfGenerator.ChromiumLaunchArguments);
    }

    [Fact]
    public void UsesTheConfiguredBrowserWhenOneIsBakedIntoTheImage()
    {
        var executable = Path.Combine(Path.GetTempPath(), "carcare-chrome-" + Guid.NewGuid().ToString("n"));
        File.WriteAllText(executable, string.Empty);

        try
        {
            Assert.Equal(executable, PdfGenerator.ResolveConfiguredExecutablePath(executable));
        }
        finally
        {
            File.Delete(executable);
        }
    }

    [Fact]
    public void RefusesAConfiguredBrowserThatIsNotThereInsteadOfDownloadingOne()
    {
        var missing = Path.Combine(Path.GetTempPath(), "carcare-absent-" + Guid.NewGuid().ToString("n"));

        var error = Assert.Throws<InvalidOperationException>(
            () => PdfGenerator.ResolveConfiguredExecutablePath(missing));

        Assert.Contains("PuppeteerExecutablePath", error.Message);
        Assert.Contains(missing, error.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void FallsBackToTheHistoricDownloadOnlyWhenNoBrowserIsConfigured(string? configured)
    {
        // Null means "no browser configured", which is what keeps local development working exactly
        // as it did: the caller then goes on to the BrowserFetcher path.
        Assert.Null(PdfGenerator.ResolveConfiguredExecutablePath(configured));
    }
}
