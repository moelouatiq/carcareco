using Carmasters.Http.Api.Branding;
using Xunit;

namespace Carmasters.Tests;

public sealed class BrandAssetsTests
{
    [Fact]
    public void PrintLogoIsAnEmbeddedDecodablePngDataUri()
    {
        const string prefix = "data:image/png;base64,";

        var dataUri = BrandAssets.LogoDataUri;

        Assert.False(string.IsNullOrWhiteSpace(dataUri));
        Assert.StartsWith(prefix, dataUri, StringComparison.Ordinal);

        var bytes = Convert.FromBase64String(dataUri[prefix.Length..]);
        Assert.True(bytes.Length > 8);
        Assert.Equal(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a }, bytes[..8]);
    }
}
