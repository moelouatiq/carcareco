using System;

namespace Carmasters.Core.Application
{
    /// <summary>
    /// Reads what an uploaded avatar actually is, from its own bytes rather than from a file name or
    /// a declared content type, both of which the caller controls. Recognises the three formats a
    /// browser can produce and display, and reports the media type and the intrinsic dimensions so
    /// the application can refuse an image that is far larger than the circle it is drawn in.
    ///
    /// Only the headers are parsed. Nothing here decodes pixels, so it cannot resize; that is done
    /// before upload, and this decides whether the result is acceptable.
    /// </summary>
    public sealed class ProfileImageContent
    {
        private ProfileImageContent(string mediaType, int width, int height)
        {
            MediaType = mediaType;
            Width = width;
            Height = height;
        }

        public string MediaType { get; }
        public int Width { get; }
        public int Height { get; }

        public static bool TryRead(byte[] content, out ProfileImageContent image)
        {
            image = null;
            if (content is null || content.Length < 16) return false;

            image = ReadPng(content) ?? ReadJpeg(content) ?? ReadWebp(content);
            return image is not null;
        }

        // 8 byte signature, then the IHDR chunk whose first two fields are the dimensions.
        private static ProfileImageContent ReadPng(byte[] c)
        {
            ReadOnlySpan<byte> signature = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
            if (c.Length < 24 || !c.AsSpan(0, 8).SequenceEqual(signature)) return null;
            if (c[12] != 'I' || c[13] != 'H' || c[14] != 'D' || c[15] != 'R') return null;

            return new ProfileImageContent("image/png", BigEndian32(c, 16), BigEndian32(c, 20));
        }

        // Walk the marker segments until a start-of-frame, which carries the dimensions.
        private static ProfileImageContent ReadJpeg(byte[] c)
        {
            if (c.Length < 4 || c[0] != 0xFF || c[1] != 0xD8) return null;

            var i = 2;
            while (i + 3 < c.Length)
            {
                if (c[i] != 0xFF) return null;

                var marker = c[i + 1];
                if (marker == 0xFF) { i++; continue; }               // fill byte
                if (marker == 0xD8 || (marker >= 0xD0 && marker <= 0xD9) || marker == 0x01) { i += 2; continue; }

                var length = (c[i + 2] << 8) | c[i + 3];
                if (length < 2 || i + 2 + length > c.Length) return null;

                var isStartOfFrame =
                    (marker >= 0xC0 && marker <= 0xC3) ||
                    (marker >= 0xC5 && marker <= 0xC7) ||
                    (marker >= 0xC9 && marker <= 0xCB) ||
                    (marker >= 0xCD && marker <= 0xCF);

                if (isStartOfFrame)
                {
                    if (i + 9 > c.Length) return null;
                    var height = (c[i + 5] << 8) | c[i + 6];
                    var width = (c[i + 7] << 8) | c[i + 8];
                    return new ProfileImageContent("image/jpeg", width, height);
                }

                i += 2 + length;
            }

            return null;
        }

        // RIFF container; the dimensions sit in the first chunk, encoded differently per variant.
        private static ProfileImageContent ReadWebp(byte[] c)
        {
            if (c.Length < 30) return null;
            if (c[0] != 'R' || c[1] != 'I' || c[2] != 'F' || c[3] != 'F') return null;
            if (c[8] != 'W' || c[9] != 'E' || c[10] != 'B' || c[11] != 'P') return null;

            var chunk = System.Text.Encoding.ASCII.GetString(c, 12, 4);
            switch (chunk)
            {
                case "VP8 ":
                    // Lossy: a 3 byte frame tag, a 3 byte sync code, then 14 bit dimensions.
                    if (c.Length < 30 || c[23] != 0x9D || c[24] != 0x01 || c[25] != 0x2A) return null;
                    return new ProfileImageContent("image/webp",
                        ((c[27] << 8) | c[26]) & 0x3FFF,
                        ((c[29] << 8) | c[28]) & 0x3FFF);

                case "VP8L":
                    // Lossless: a signature byte, then both dimensions minus one packed into 28 bits.
                    if (c.Length < 25 || c[20] != 0x2F) return null;
                    var bits = c[21] | (c[22] << 8) | (c[23] << 16) | (c[24] << 24);
                    return new ProfileImageContent("image/webp",
                        (bits & 0x3FFF) + 1,
                        ((bits >> 14) & 0x3FFF) + 1);

                case "VP8X":
                    // Extended: canvas size as two 24 bit little endian values, each minus one.
                    if (c.Length < 30) return null;
                    return new ProfileImageContent("image/webp",
                        (c[24] | (c[25] << 8) | (c[26] << 16)) + 1,
                        (c[27] | (c[28] << 8) | (c[29] << 16)) + 1);

                default:
                    return null;
            }
        }

        private static int BigEndian32(byte[] c, int offset)
            => (c[offset] << 24) | (c[offset + 1] << 16) | (c[offset + 2] << 8) | c[offset + 3];
    }
}
