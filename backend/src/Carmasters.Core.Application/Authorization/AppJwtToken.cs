using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;
using Carmasters.Core.Application.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Carmasters.Core.Application.Authorization
{
    public class AppJwtToken
    {

        public static JwtSecurityToken LoadJwt(JwtOptions options, string token)
        {
            EnsureJwtSecret(options);
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(options.Secret);
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;

            return jwtToken;
        }

        public static string Generate(JwtOptions options, ClaimsPrincipal principal)
        {
            EnsureJwtSecret(options);
            // generate token that is valid for 7 days
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(options.Secret);

            var subject = ((ClaimsIdentity)principal.Identity);

            var tokenDescriptor = new SecurityTokenDescriptor
            { 
                Subject = subject,
                IssuedAt = DateTime.UtcNow,
                Expires = DateTime.UtcNow.Add(options.SessionTimeout),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
        private static void EnsureJwtSecret(JwtOptions options)
        {
            if (string.IsNullOrWhiteSpace(options.Secret)) throw new ArgumentException("Jwt secret not configured");
        }

        public static void ValidateConfiguration(JwtOptions options, bool requireProductionStrength)
        {
            EnsureJwtSecret(options);

            if (string.IsNullOrWhiteSpace(options.ConsumerSecret))
                throw new ArgumentException("JWT consumer secret is not configured.");
            if (options.SessionTimeout <= TimeSpan.Zero)
                throw new ArgumentException("JWT session timeout must be positive.");

            if (!requireProductionStrength) return;

            if (options.Secret.Length < 64 || IsPlaceholder(options.Secret))
                throw new ArgumentException("Production JWT secret must contain at least 64 non-placeholder characters.");
            if (options.ConsumerSecret.Length < 32 || IsPlaceholder(options.ConsumerSecret))
                throw new ArgumentException("Production consumer secret must contain at least 32 non-placeholder characters.");
            if (options.SessionTimeout > TimeSpan.FromHours(12))
                throw new ArgumentException("Production JWT session timeout cannot exceed 12 hours.");
        }

        private static bool IsPlaceholder(string value)
        {
            var normalized = value.Trim().ToLowerInvariant();
            return normalized.Contains("secret")
                || normalized.Contains("password")
                || normalized.Contains("change-me")
                || normalized.StartsWith("[")
                || normalized is "default" or "admin" or "carcare";
        }

    }
}
