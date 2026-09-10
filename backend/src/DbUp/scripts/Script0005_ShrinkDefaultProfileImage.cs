using System.Data;
using System.Security.Cryptography;
using Npgsql;

namespace DbUp.Scripts
{
    /// <summary>
    /// The seeded avatar was a 1024x1024 image of about 1.4 MB, served on every page for a circle
    /// 32 pixels across. resources/default_admin.png has been replaced with a 128x128 version, but
    /// Script0001 has already run everywhere, so the rows it wrote still hold the large image.
    ///
    /// This replaces it only where the stored bytes are still exactly the old default. A user who
    /// has uploaded their own photo has different bytes and is left alone: nothing here overwrites
    /// a picture somebody chose.
    /// </summary>
    internal class Script0005_ShrinkDefaultProfileImage : DbUp.Engine.IScript
    {
        /// MD5 of the 1024x1024 resources/default_admin.png as Script0001 seeded it. Used only to
        /// recognise that exact file, never as a security check.
        private const string PreviousDefaultMd5 = "55731954fcc804515365f080fd0f78c7";

        public string ProvideScript(Func<IDbCommand> dbCommandFactory)
        {
            var imagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "resources", "default_admin.png");
            if (!File.Exists(imagePath))
            {
                Console.WriteLine($"Default profile image not found at {imagePath}; leaving stored images untouched.");
                return "";
            }

            var replacement = File.ReadAllBytes(imagePath);
            if (Md5Of(replacement) == PreviousDefaultMd5)
            {
                // The asset has not been replaced after all: swapping the old image for itself would
                // be pointless, and going ahead would hide that the intended change never landed.
                Console.WriteLine("Default profile image is still the previous one; nothing to shrink.");
                return "";
            }

            var command = (NpgsqlCommand)dbCommandFactory();
            command.CommandText = @"UPDATE public.user
                                       SET profile_image = @ProfileImage
                                     WHERE profile_image IS NOT NULL
                                       AND md5(profile_image) = @PreviousMd5";

            using (command)
            {
                command.Parameters.AddWithValue("@ProfileImage", replacement);
                command.Parameters.AddWithValue("@PreviousMd5", PreviousDefaultMd5);
                var updated = command.ExecuteNonQuery();
                Console.WriteLine(updated == 0
                    ? "No account was still carrying the previous default profile image."
                    : $"Replaced the previous default profile image on {updated} account(s).");
            }

            return "";
        }

        private static string Md5Of(byte[] content)
            => Convert.ToHexString(MD5.HashData(content)).ToLowerInvariant();
    }
}
