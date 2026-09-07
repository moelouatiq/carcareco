using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Linq;

namespace Carmasters.Core.Application.Extensions.DependencyInjection
{
    public static class CorsExtensions
    {
        public static IServiceCollection AddCorsToApp(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            var configuredOrigins = configuration
                .GetSection("Cors:AllowedOrigins")
                .Get<string[]>() ?? Array.Empty<string>();

            var allowedOrigins = configuredOrigins.Select(NormalizeOrigin).Distinct().ToArray();
            if (allowedOrigins.Length == 0)
            {
                throw new InvalidOperationException("Cors:AllowedOrigins must contain at least one exact origin.");
            }

            if (environment.IsProduction() && allowedOrigins.Any(origin =>
                new Uri(origin).IsLoopback || !origin.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
            {
                throw new InvalidOperationException("Production CORS origins must use HTTPS and cannot be loopback addresses.");
            }

            return services.AddCors(options =>
            {
                options.AddPolicy("DefaultPolicy", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                        .WithHeaders("Content-Type", "Authorization")
                        .WithMethods("GET", "PUT", "POST", "DELETE", "OPTIONS");
                });
            });
        }

        private static string NormalizeOrigin(string origin)
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
                || !string.IsNullOrEmpty(uri.UserInfo)
                || (uri.AbsolutePath != "/" && !string.IsNullOrEmpty(uri.AbsolutePath))
                || !string.IsNullOrEmpty(uri.Query)
                || !string.IsNullOrEmpty(uri.Fragment))
            {
                throw new InvalidOperationException($"Invalid CORS origin: {origin}");
            }

            return uri.GetLeftPart(UriPartial.Authority);
        }
    }
}
