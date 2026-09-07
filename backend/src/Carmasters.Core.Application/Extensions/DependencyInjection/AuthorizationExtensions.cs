using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using Carmasters.Core.Application.Authorization;
using Carmasters.Core.Application.Configuration;

namespace Carmasters.Core.Application.Extensions.DependencyInjection
{
	public static class AuthorizationExtensions
    {
    
        public static IServiceCollection AddJwtAuthenticationToApp(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment environment)
        {
            var jwtSettings = configuration.GetSection("JwtOptions");
            var jwtOptions = jwtSettings.Get<JwtOptions>()
                ?? throw new InvalidOperationException("JwtOptions are not configured.");
            AppJwtToken.ValidateConfiguration(jwtOptions, environment.IsProduction());
            var key = Encoding.UTF8.GetBytes(jwtOptions.Secret);

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
                    ClockSkew = TimeSpan.Zero
                };
			});
            return services;
        }
    }
}
