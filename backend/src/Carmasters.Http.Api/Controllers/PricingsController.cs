using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Core.Application.Services;
using Carmasters.Core.Domain;
using Carmasters.Http.Api.Model;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NHibernate;
using static System.Collections.Specialized.BitVector32;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace Carmasters.Http.Api.Controllers
{
    [TenantRateLimit]
    [Authorize(Policy = "ServerSidePolicy")]
    [Route("api/[controller]")]
    [ApiController]
    public class PricingsController : ControllerBase
    {
        private readonly NHibernate.ISession repository;
        private readonly IPdfGenerator pdfGenerator;
        private readonly ILogger<PricingsController> logger;

        public PricingsController(
            NHibernate.ISession repository,
            IPdfGenerator pdfGenerator,
            ILogger<PricingsController> logger)
        {
            this.repository = repository;
            this.pdfGenerator = pdfGenerator;
            this.logger = logger;
        }

        [HttpGet("offers/{workId}")]
        public OkObjectResult GetAllOfferPricings(Guid workId) //todo better place?
        { 
            var issuances =  repository.Connection.Query<OfferIssuanceDto>(
                                  @"   select  
                                        o.id,
                                        est.number, 
                                        e.senton,
	                                    e.issuedon,
	                                    e.email as receiveremail,
	                                    i.firstname||' '||i.lastname as issuedby,
	                                    acceptedon,
	                                    (select firstname||' '||lastname from domain.employee where id = o.acceptorid)  as acceptedby 
	                                    from   domain.offer o
	                                    inner join domain.pricing e on e.id = o.estimateId
                                        inner join domain.estimate est on est.id = o.estimateid
	                                    inner join domain.employee i on i.id = e.issuerid where o.workid = @workId", new { workId = workId })
                                  .ToList();
             
            return Ok(issuances);
        }


        [HttpGet("invoice/{workId}/{type}")]
        public async Task<IActionResult> PrintInvoice(Guid workId,string type)
        {
            var invoice = FindInvoiceForWork(workId);

            if(type == "pdf")
            {
                return await PdfResult(invoice, false);
            }
            return await HtmlResult(invoice);

        }

        [HttpGet("invoice/{workId}/pdf/download")]
        public async Task<IActionResult> DownloadInvoice(Guid workId)
        {
            return await PdfResult(FindInvoiceForWork(workId), true);
        }

        [HttpGet("offer/{offerId}/{type}")]
        public async Task<IActionResult> PrintEstimatePdf(Guid offerId, string type)
        {
            var estimateId = repository.QueryOver<Offer>().Where(x => x.Id == offerId).Select(x => x.Estimate.Id).SingleOrDefault<Guid>();

            var estimate = repository.Get<Estimate>(estimateId);

            if (type == "pdf")
            {
                return await PdfResult(estimate, false);
            }
            return await HtmlResult(estimate);
        }
        private async Task<IActionResult> HtmlResult(Pricing pricing)
        {
            if (pricing == null) return NotFound();

            var body = await pdfGenerator.GetBodyGenerator().Generate(pricing);
           // var footer = await pdfGenerator.GetFooterGenerator().Generate(pricing);

            return new ContentResult()
            {
                Content = body,
                ContentType = "text/html",
            };
        }
        private Invoice FindInvoiceForWork(Guid workId)
        {
            // Project the id instead of loading the work: reading work.Invoice hands back a lazy
            // NHibernate proxy whose type name is "InvoiceProxy", and the print template dispatches
            // its partials on pricing.GetType().Name. Get<Invoice> returns the real entity.
            var invoiceId = repository.QueryOver<Work>()
                .Where(x => x.Id == workId)
                .Select(x => x.Invoice.Id)
                .SingleOrDefault<Guid?>();

            return invoiceId.HasValue ? repository.Get<Invoice>(invoiceId.Value) : null;
        }

        private async Task<IActionResult> PdfResult(Pricing pricing, bool download)
        {
            if (pricing == null) return NotFound();

            // Single source of truth: the domain names the document (facture_7.pdf / devis_3.pdf),
            // so download, inline view and email attachment always agree.
            var fileName = pricing.GetFileName();

            try
            {
                var pdfBytes = await pdfGenerator.Generate(pricing);
                var disposition = download ? "attachment" : "inline";
                Response.Headers.Append("Content-Disposition", $"{disposition}; filename=\"{fileName}\"");
                return File(pdfBytes, "application/pdf");
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Unable to generate pricing PDF {PricingId}", pricing.Id);
                return Problem(
                    statusCode: StatusCodes.Status500InternalServerError,
                    title: "Invoice PDF generation failed",
                    detail: "The invoice PDF could not be generated. Please try again.");
            }
        }



    }
}
