using System;
using System.IO;
using System.Linq;
using System.Threading;

namespace Carmasters.Http.Api.Branding;

public static class BrandAssets
{
    private const string ExpectedLogoResourceName =
        "Carmasters.Http.Api.Branding.othman-benhicham-logo-print.png";

    private static readonly Lazy<string> LogoDataUriValue =
        new(LoadLogoDataUri, LazyThreadSafetyMode.ExecutionAndPublication);

    public static string LogoDataUri => LogoDataUriValue.Value;

    private static string LoadLogoDataUri()
    {
        var assembly = typeof(BrandAssets).Assembly;
        var resourceNames = assembly.GetManifestResourceNames();
        var resourceName = resourceNames.SingleOrDefault(name =>
            string.Equals(name, ExpectedLogoResourceName, StringComparison.Ordinal));

        if (resourceName is null)
        {
            throw new InvalidOperationException(
                $"Embedded branding resource '{ExpectedLogoResourceName}' was not found. " +
                $"Available resources: {string.Join(", ", resourceNames)}");
        }

        using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException(
                $"Embedded branding resource '{resourceName}' could not be opened.");
        using var buffer = new MemoryStream();
        stream.CopyTo(buffer);

        return "data:image/png;base64," + Convert.ToBase64String(buffer.ToArray());
    }
}
