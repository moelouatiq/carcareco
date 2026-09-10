using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Carmasters.Core.Application;
using Carmasters.Core.Domain;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// The avatar is served to the browser on every page, so what may be stored decides what every
/// visitor downloads. These tests pin the two things that keep it small: the format is read from the
/// bytes rather than from anything the caller says, and the dimensions are a limit rather than a
/// suggestion.
/// </summary>
public sealed class ProfileImageTests
{
    // ---- format read from the bytes -------------------------------------------------------------

    [Fact]
    public void ReadsPngDimensions()
    {
        Assert.True(ProfileImageContent.TryRead(Png(120, 64), out var image));
        Assert.Equal("image/png", image.MediaType);
        Assert.Equal(120, image.Width);
        Assert.Equal(64, image.Height);
    }

    [Fact]
    public void ReadsJpegDimensions()
    {
        Assert.True(ProfileImageContent.TryRead(Jpeg(200, 100), out var image));
        Assert.Equal("image/jpeg", image.MediaType);
        Assert.Equal(200, image.Width);
        Assert.Equal(100, image.Height);
    }

    [Fact]
    public void ReadsLossyWebpDimensions()
    {
        Assert.True(ProfileImageContent.TryRead(WebpLossy(90, 70), out var image));
        Assert.Equal("image/webp", image.MediaType);
        Assert.Equal(90, image.Width);
        Assert.Equal(70, image.Height);
    }

    [Theory]
    [InlineData("pas une image du tout")]
    [InlineData("%PDF-1.7 un document")]
    [InlineData("GIF89a")]
    public void RefusesWhatIsNotASupportedImage(string content)
    {
        Assert.False(ProfileImageContent.TryRead(System.Text.Encoding.ASCII.GetBytes(content), out _));
    }

    [Fact]
    public void RefusesTruncatedContent()
    {
        Assert.False(ProfileImageContent.TryRead(Png(64, 64).Take(12).ToArray(), out _));
        Assert.False(ProfileImageContent.TryRead(Array.Empty<byte>(), out _));
        Assert.False(ProfileImageContent.TryRead(null, out _));
    }

    [Fact]
    public void IsNotFooledByAFileNameOrADeclaredType()
    {
        // A caller can name a file avatar.png and declare image/png; only the bytes decide.
        var actuallyJpeg = Jpeg(48, 48);
        Assert.True(ProfileImageContent.TryRead(actuallyJpeg, out var image));
        Assert.Equal("image/jpeg", image.MediaType);
    }

    // ---- what may be stored ---------------------------------------------------------------------

    [Fact]
    public void AcceptsAnAvatarWithinTheLimits()
    {
        var user = NewUser();
        var avatar = Png(User.MaximumProfileImageDimension, User.MaximumProfileImageDimension);

        user.ChangeProfileImage(avatar);

        Assert.Equal(avatar, user.ProfileImage);
    }

    [Fact]
    public void RefusesAnImageLargerThanItIsEverDrawn()
    {
        var user = NewUser();

        var error = Assert.Throws<UserException>(
            () => user.ChangeProfileImage(Png(User.MaximumProfileImageDimension + 1, 64)));

        Assert.Contains(User.MaximumProfileImageDimension.ToString(), error.Message);
    }

    [Fact]
    public void RefusesTooManyBytesEvenAtAnAcceptableSize()
    {
        var user = NewUser();
        // Correct header, then padding past the ceiling: the byte count is checked on its own.
        var bloated = Png(64, 64).Concat(new byte[User.MaximumProfileImageBytes]).ToArray();

        Assert.Throws<UserException>(() => user.ChangeProfileImage(bloated));
    }

    [Fact]
    public void RefusesContentThatIsNotAnImage()
    {
        var user = NewUser();

        var error = Assert.Throws<UserException>(
            () => user.ChangeProfileImage(System.Text.Encoding.ASCII.GetBytes("<script>alert(1)</script>")));

        Assert.Contains("PNG", error.Message);
    }

    [Fact]
    public void KeepsAllowingNoPictureAtAll()
    {
        var user = NewUser();

        user.ChangeProfileImage(null);
        Assert.Null(user.ProfileImage);

        user.ChangeProfileImage(Array.Empty<byte>());
        Assert.NotNull(user.ProfileImage);
        Assert.Empty(user.ProfileImage!);
    }

    // ---- the shipped default --------------------------------------------------------------------

    [Fact]
    public void TheDefaultAvatarIsSmallEnoughToShipOnEveryPage()
    {
        var path = DefaultAvatarPath();
        var content = File.ReadAllBytes(path);

        Assert.True(ProfileImageContent.TryRead(content, out var image), $"{path} is not a readable image.");
        Assert.Equal("image/png", image.MediaType);
        Assert.True(image.Width <= 128 && image.Height <= 128,
            $"The default avatar is {image.Width}x{image.Height}; it is drawn far smaller than that.");
        Assert.True(content.Length <= 30 * 1024,
            $"The default avatar weighs {content.Length / 1024} kB and is served on every page.");
    }

    [Fact]
    public void TheDefaultAvatarIsAcceptedByTheSameRuleAsAnUpload()
    {
        var user = NewUser();
        user.ChangeProfileImage(File.ReadAllBytes(DefaultAvatarPath()));
        Assert.NotEmpty(user.ProfileImage);
    }

    // ---- helpers --------------------------------------------------------------------------------

    private static User NewUser() =>
        new("someone", "hash", "someone@example.invalid", true, Array.Empty<byte>());

    private static string DefaultAvatarPath()
    {
        var directory = new DirectoryInfo(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!);
        while (directory != null && !Directory.Exists(Path.Combine(directory.FullName, "Carmasters.Http.Api")))
        {
            directory = directory.Parent;
        }

        Assert.NotNull(directory);
        return Path.Combine(directory!.FullName, "Carmasters.Http.Api", "resources", "default_admin.png");
    }

    private static byte[] Png(int width, int height)
    {
        var bytes = new byte[24];
        new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }.CopyTo(bytes, 0);
        bytes[11] = 13;                                     // IHDR length
        bytes[12] = (byte)'I'; bytes[13] = (byte)'H'; bytes[14] = (byte)'D'; bytes[15] = (byte)'R';
        WriteBigEndian(bytes, 16, width);
        WriteBigEndian(bytes, 20, height);
        return bytes;
    }

    private static byte[] Jpeg(int width, int height)
    {
        // The segment declares a length of 17, so the buffer has to actually hold it: a real
        // start-of-frame carries the component descriptors after the dimensions.
        var bytes = new byte[2 + 2 + 17];
        bytes[0] = 0xFF; bytes[1] = 0xD8;                   // start of image
        bytes[2] = 0xFF; bytes[3] = 0xC0;                   // baseline start of frame
        bytes[4] = 0x00; bytes[5] = 0x11;                   // segment length
        bytes[6] = 8;                                       // sample precision
        bytes[7] = (byte)(height >> 8); bytes[8] = (byte)(height & 0xFF);
        bytes[9] = (byte)(width >> 8); bytes[10] = (byte)(width & 0xFF);
        return bytes;
    }

    private static byte[] WebpLossy(int width, int height)
    {
        var bytes = new byte[30];
        "RIFF".Select(c => (byte)c).ToArray().CopyTo(bytes, 0);
        "WEBP".Select(c => (byte)c).ToArray().CopyTo(bytes, 8);
        "VP8 ".Select(c => (byte)c).ToArray().CopyTo(bytes, 12);
        bytes[23] = 0x9D; bytes[24] = 0x01; bytes[25] = 0x2A;   // sync code
        bytes[26] = (byte)(width & 0xFF); bytes[27] = (byte)(width >> 8);
        bytes[28] = (byte)(height & 0xFF); bytes[29] = (byte)(height >> 8);
        return bytes;
    }

    private static void WriteBigEndian(byte[] target, int offset, int value)
    {
        target[offset] = (byte)(value >> 24);
        target[offset + 1] = (byte)(value >> 16);
        target[offset + 2] = (byte)(value >> 8);
        target[offset + 3] = (byte)value;
    }
}
