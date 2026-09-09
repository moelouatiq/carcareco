using System;
using System.Linq;
using Carmasters.Core.Application.Configuration;
using Npgsql;

namespace Carmasters.Core.Application.Database
{
    /// <summary>
    /// Applies the optional TLS settings from <see cref="DbOptions"/> to a connection string builder.
    ///
    /// DbUp, the API and the multi-tenancy connection driver each build their own connection string.
    /// Routing all three through here keeps them from ending up with different TLS behaviour against
    /// the same database.
    /// </summary>
    public static class PostgresTls
    {
        /// <summary>
        /// Applies SslMode and RootCertificate when configured. When neither is set the builder is
        /// left untouched, so an existing deployment keeps the exact connection string it had before.
        /// </summary>
        public static NpgsqlConnectionStringBuilder Apply(NpgsqlConnectionStringBuilder builder, DbOptions options)
        {
            if (builder is null) throw new ArgumentNullException(nameof(builder));

            if (!string.IsNullOrWhiteSpace(options?.SslMode))
            {
                builder.SslMode = ParseSslMode(options.SslMode);
            }

            if (!string.IsNullOrWhiteSpace(options?.RootCertificate))
            {
                builder.RootCertificate = options.RootCertificate;
            }

            return builder;
        }

        /// <summary>
        /// Parses a configured SSL mode. An unrecognised value fails loudly rather than falling back
        /// to a weaker mode: silently downgrading TLS is exactly the failure this setting exists to
        /// prevent.
        /// </summary>
        public static SslMode ParseSslMode(string value)
        {
            if (!Enum.TryParse<SslMode>(value, ignoreCase: true, out var parsed)
                || !Enum.IsDefined(typeof(SslMode), parsed))
            {
                var supported = string.Join(", ", Enum.GetNames(typeof(SslMode)));
                throw new InvalidOperationException(
                    $"DbOptions:SslMode has an unsupported value '{value}'. Supported values are: {supported}.");
            }

            return parsed;
        }
    }
}
