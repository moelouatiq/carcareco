using System;
using System.IO;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Carmasters.Core.Application.Extensions.DependencyInjection
{
    public static class DataProtectionExtensions
    {
        /// <summary>
        /// Registers Data Protection. The default is the historic file backed key ring; hosts with a
        /// read-only filesystem opt into an in-memory key ring with DataProtection:Ephemeral=true.
        /// </summary>
        public static IServiceCollection AddDataProtectionToApp(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            var dataProtection = services
                .AddDataProtection()
                .SetApplicationName("CarCare");

            // An in-memory key ring is only safe while nothing in this application protects a payload
            // that has to survive a restart: no IDataProtector is resolved anywhere, authentication is
            // JWT bearer and those tokens are signed from JwtOptions.Secret, and no cookie, session,
            // antiforgery or persisted TempData depends on the key ring. Revisit this the moment any
            // of those is introduced -- keys would then have to be shared and persisted instead.
            if (ReadEphemeralFlag(configuration))
            {
                return services.AddEphemeralKeyRing(dataProtection);
            }

            var configuredPath = configuration["DataProtection:KeysDirectory"];
            if (environment.IsProduction() && string.IsNullOrWhiteSpace(configuredPath))
            {
                throw new InvalidOperationException(
                    "DataProtection:KeysDirectory must point to persistent storage in production.");
            }

            var keysDirectory = configuredPath
                ?? Path.Combine(environment.ContentRootPath, ".data-protection-keys");
            Directory.CreateDirectory(keysDirectory);
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keysDirectory));

            if (!environment.IsProduction()) return services;

            var certificatePath = configuration["DataProtection:CertificatePath"];
            var certificatePassword = configuration["DataProtection:CertificatePassword"];
            if (string.IsNullOrWhiteSpace(certificatePath) || string.IsNullOrWhiteSpace(certificatePassword))
            {
                throw new InvalidOperationException(
                    "A Data Protection certificate path and password are required in production.");
            }

            dataProtection.ProtectKeysWithCertificate(X509CertificateLoader.LoadPkcs12FromFile(
                certificatePath,
                certificatePassword,
                X509KeyStorageFlags.EphemeralKeySet));

            return services;
        }

        private static IServiceCollection AddEphemeralKeyRing(
            this IServiceCollection services,
            IDataProtectionBuilder dataProtection)
        {
            // Neither a keys directory nor a certificate is read here: the provider keeps its keys in
            // memory, so it never touches the filesystem and never has to be told where to write.
            dataProtection.UseEphemeralDataProtectionProvider();
            return services;
        }

        /// <summary>
        /// Deliberately strict: an unreadable value must not silently fall back to the persistent mode,
        /// which would fail at startup on a read-only host for a reason that looks unrelated.
        /// </summary>
        private static bool ReadEphemeralFlag(IConfiguration configuration)
        {
            var configured = configuration["DataProtection:Ephemeral"];
            if (string.IsNullOrWhiteSpace(configured)) return false;

            if (!bool.TryParse(configured.Trim(), out var ephemeral))
            {
                throw new InvalidOperationException(
                    $"DataProtection:Ephemeral has an unsupported value '{configured}'. "
                    + "Supported values are: true, false.");
            }

            return ephemeral;
        }
    }
}
