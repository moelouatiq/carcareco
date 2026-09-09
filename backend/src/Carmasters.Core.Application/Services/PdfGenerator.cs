using Carmasters.Core.Application;
using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.Model;
using Carmasters.Core.Application.Printing;
using Carmasters.Core.Domain;
using FluentNHibernate.Conventions.Inspections;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PuppeteerSharp;
using PuppeteerSharp.Media;
using System;
using System.IO;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Logging;
using NHibernate.Criterion;

namespace Carmasters.Core.Application.Services
{
    public interface IPdfGenerator
    {
        Task<byte[]> Generate(Pricing pricing);
        IPricingHtmlGenerator GetBodyGenerator();
        IPricingHtmlGenerator GetFooterGenerator();
    }

    public interface IPricingHtmlGenerator
    {
        Task<string> Generate(Pricing pricing); 
    }

    public class PricingFooterHtmlGenerator : PricingHtmlBaseGenerator
    {
        public PricingFooterHtmlGenerator(
            ITemplateService templateService,
            ITenantConfigService tenantConfigService)
            : base(templateService, tenantConfigService)
        {
        }

        public override async Task<string> Generate(Pricing pricing)
        {
            var model = await CreatePricingModelAsync(pricing);
            var footerHtml = await templateService.RenderAsync("Print/Footer", model);
            return footerHtml;
        }
    }


    public class PricingBodyHtmlGenerator : PricingHtmlBaseGenerator
    {
        public PricingBodyHtmlGenerator(
            ITemplateService templateService,
            ITenantConfigService tenantConfigService)
            : base(templateService, tenantConfigService)
        {
        }

        public override async Task<string> Generate(Pricing pricing)
        {
            var model = await CreatePricingModelAsync(pricing);
            var html = await templateService.RenderAsync("Print/PricingOutput", model);
            return html;
        }
    }



    public abstract class PricingHtmlBaseGenerator : IPricingHtmlGenerator
    {
        protected readonly ITemplateService templateService;
        protected readonly ITenantConfigService tenantConfigService;

        public PricingHtmlBaseGenerator(
            ITemplateService templateService,
            ITenantConfigService tenantConfigService)
        {
            this.templateService = templateService;
            this.tenantConfigService = tenantConfigService;
        }

        protected async Task<PricingPrintModel> CreatePricingModelAsync(Pricing pricing)
        {
            var requisites = await tenantConfigService.GetRequisitesAsync();
            var pricingOptions = await tenantConfigService.GetPricingAsync();

            var model = new PricingPrintModel
            {
                Pricing = pricing,
                RequisitesOptions = requisites,
                PricingOptions = pricingOptions
            };

            return model;
        }

        public abstract Task<string> Generate(Pricing pricing);
    }
    //does not work in another assembly
    public class PdfGenerator : IPdfGenerator
    {
        private readonly IWebHostEnvironment env;
        private readonly IConfiguration configuration;
        private readonly PricingBodyHtmlGenerator bodyHtmlGenerator;
        private readonly PricingFooterHtmlGenerator footerHtmlGenerator;
        private readonly ILogger<PdfGenerator> logger;
        private readonly Uri serverUri;

        public PdfGenerator(IWebHostEnvironment env, IConfiguration configuration,
             PricingBodyHtmlGenerator bodyHtmlGenerator,
             PricingFooterHtmlGenerator footerHtmlGenerator,
             IServer server,
             ILogger<PdfGenerator> logger)
        {
            this.env = env;
            this.configuration = configuration;
            this.bodyHtmlGenerator = bodyHtmlGenerator;
            this.footerHtmlGenerator = footerHtmlGenerator;
            this.logger = logger;
            var addressFeature = server.Features.Get<IServerAddressesFeature>();
            serverUri=  new Uri(addressFeature.Addresses.ToList().SingleOrDefault());
            logger.LogDebug("Pdf service reachable at : " + serverUri); 
        }

        IPricingHtmlGenerator IPdfGenerator.GetBodyGenerator()
        {
            return bodyHtmlGenerator;
        }

        IPricingHtmlGenerator IPdfGenerator.GetFooterGenerator()
        {
            return footerHtmlGenerator;
        }

        public async Task<byte[]> Generate(Pricing pricing ) 
        {  
            var stream = await Print(pricing);
            using (stream)
            {
                return stream.ToArray();
            }
        }

        /// <summary>
        /// Flags every Chromium launch needs on a container host: no user namespaces to build a
        /// sandbox from, a /dev/shm too small for the default shared memory backing store, and no GPU.
        /// </summary>
        public static readonly IReadOnlyList<string> ChromiumLaunchArguments = new[]
        {
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        };

        private static string _downloadedExecutablePath;

        /// <summary>
        /// Returns the browser configured through PuppeteerExecutablePath, or null when none is set.
        /// A configured path that does not exist is an error rather than a reason to download: a
        /// read-only host has nowhere to put a download, so the fallback would only turn a clear
        /// configuration mistake into an obscure runtime failure.
        /// </summary>
        public static string ResolveConfiguredExecutablePath(string configuredExecutable)
        {
            if (string.IsNullOrWhiteSpace(configuredExecutable)) return null;

            if (!File.Exists(configuredExecutable))
            {
                throw new InvalidOperationException(
                    $"PuppeteerExecutablePath points to '{configuredExecutable}', which does not exist.");
            }

            return configuredExecutable;
        }

        private async Task<string> ResolveExecutablePathAsync()
        {
            var configuredExecutable = ResolveConfiguredExecutablePath(
                configuration["PuppeteerExecutablePath"]);
            if (configuredExecutable != null) return configuredExecutable;

            if (!string.IsNullOrWhiteSpace(_downloadedExecutablePath)) return _downloadedExecutablePath;//TODO is it threadsafe?

            var downloadPath = configuration["PuppeteerPath"];
            var browserOptions = new BrowserFetcherOptions { 
                Path = downloadPath , 
            };
            var browserFetcher = new BrowserFetcher(browserOptions);

            var stableVersion = await browserFetcher.DownloadAsync(BrowserTag.Stable);

            _downloadedExecutablePath = browserFetcher.GetExecutablePath(stableVersion.BuildId);
            logger.LogDebug("Puppeteer downloaded browser : " + _downloadedExecutablePath);

            return _downloadedExecutablePath;
        }

        private async Task<MemoryStream> Print(Pricing pricing )
        {
             
            var html = await bodyHtmlGenerator.Generate(pricing); 

            var executablePath = await ResolveExecutablePathAsync();

            // A profile directory of its own per render: concurrent requests each launch their own
            // browser, and Chromium refuses to share one. It lives under the temp directory because
            // that is the only writable location the container is guaranteed to have.
            var userDataDirectory = Path.Combine(
                Path.GetTempPath(), "carcare-chromium-" + Guid.NewGuid().ToString("n"));
            Directory.CreateDirectory(userDataDirectory);

            try
            {
                await using var browser = await Puppeteer.LaunchAsync(new LaunchOptions
                {
                    Headless = true,
                    Args = ChromiumLaunchArguments.ToArray(),
                    ExecutablePath = executablePath,
                    UserDataDir = userDataDirectory
                });
                 
                var page = await browser.NewPageAsync(); 

                await page.SetViewportAsync(new ViewPortOptions() { DeviceScaleFactor = 1, Width = 1440, Height = 2880, IsMobile = false, HasTouch = false });
                await page.SetContentAsync(html, options: new NavigationOptions() { WaitUntil = new [] { WaitUntilNavigation.Load  } });
                var tailWindCss = $"{serverUri.Scheme}://localhost:{serverUri.Port}/tailwind.css";
                var printCss = $"{serverUri.Scheme}://localhost:{serverUri.Port}/print.css";
                await page.AddStyleTagAsync(tailWindCss);
                await page.AddStyleTagAsync(printCss);
           
             
                var pdfContent = await page.PdfStreamAsync(new PdfOptions
                {
                    PrintBackground = false,
                    Format = PaperFormat.A4, 
                    DisplayHeaderFooter = false  
                });
                return (MemoryStream)pdfContent;
            }
            finally
            {
                try
                {
                    Directory.Delete(userDataDirectory, recursive: true);
                }
                catch (IOException)
                {
                    // The profile is disposable; a leftover directory must not fail the render.
                }
            }
        } 
    }
}
