using System;
using System.IO;
using System.Threading.Tasks;
using Carmasters.Core.Application.Database;
using Carmasters.Core.Application.Documentation;
using Carmasters.Core.Application.Errors;
using Carmasters.Core.Application.Extensions.Builder;
using Carmasters.Core.Application.Extensions.DependencyInjection;
using Carmasters.Core.Application.Printing;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Core.Application.Services;
using Carmasters.Core.Domain;
using Carmasters.Core.Repository.Postgres;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost
    .UseContentRoot(Directory.GetCurrentDirectory())
    .UseWebRoot("wwwroot")
    .UseStaticWebAssets();

builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

builder.Services.AddDataProtectionToApp(builder.Configuration, builder.Environment);

builder.Services
    .AddAppMapping()
    .AddPersistanceServices(builder.Configuration)
    .AddScoped<ITemplateService, RazorViewsTemplateService>()
    .AddScoped<IPdfGenerator, PdfGenerator>()
    .AddScoped<PricingFooterHtmlGenerator>()
    .AddScoped<PricingBodyHtmlGenerator>()
    .AddScoped<IPricingSender, PricingPdfMailSender>()
    .AddSingleton<ISmtpClientFactory, SmtpClientFactory>()
    .AddDemoSetupServices()
    .AddCorsToApp(builder.Configuration, builder.Environment)
    .AddControllersWithViewsToApp()
    .AddHealthChecks().Services
    .AddSwaggerToApp()
    .AddJwtAuthenticationToApp(builder.Configuration, builder.Environment)
    .AddHttpContextAccessor()
    .AddDistributedMemoryCache()
    .AddApplicationOptions(builder.Configuration)
    .AddExceptionHandler<JsonExceptionHandler>()
    .AddTenantConfigurationServices();

builder.Services.AddSingleton<RateLimitStrategyFactory>();

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async _ =>
    {
        await Task.CompletedTask; // JsonExceptionHandler will not run without a terminal delegate.
    });
});
app.UseStatusCodePages();
// Static files are served before routing: once an endpoint has been selected the static file
// middleware steps aside, which left the print stylesheet behind the fallback authorization
// policy when the app runs from sources rather than from a publish output.
app.UseStaticFiles();
app.UseRouting();
app.MapStaticAssets().AllowAnonymous();

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        var js = File.ReadAllText(Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "Documentation",
            "SwaggerJwtInetercept.js")).ReplaceLineEndings(" ");
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CarCare API V1");
        c.RoutePrefix = string.Empty;
        c.UseRequestInterceptor(js);
    });
}

app.UseCors("DefaultPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseNHibernate();
app.UseMiddleware<DbConnectionScopeMiddleware>();
app.UseRateLimiting();

app.MapHealthChecks("/health").AllowAnonymous();
app.MapControllers();

app.Run();
