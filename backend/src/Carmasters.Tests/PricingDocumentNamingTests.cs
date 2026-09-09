using System.Text.RegularExpressions;
using Carmasters.Core.Domain;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// The document name has a single source of truth: Pricing.GetFileName on the domain object.
/// Everything that hands a document to a user goes through it -- the PDF endpoints via
/// PricingsController.PdfResult, and the email attachment via PricingPdfMailSender -- so locking
/// it here locks the convention for download, inline view and email at once.
/// </summary>
public sealed class PricingDocumentNamingTests
{
    [Fact]
    public void InvoiceIsNamedAfterItsBusinessNumber()
    {
        var invoice = new Invoice(7, issuer: null, issuedOn: default, PaymentType.Cash, dueDays: 14, partyName: "Client");

        Assert.Equal("facture_7.pdf", invoice.GetFileName());
        Assert.Matches(new Regex("^facture_[0-9]+\\.pdf$"), invoice.GetFileName());
    }

    [Fact]
    public void EstimateIsNamedAfterItsBusinessNumber()
    {
        // Offer.Issue composes an estimate number as "{work number}-{offer order}", stored in a
        // varchar column -- so a real estimate is 6-0, and the file name carries that number as is.
        var estimate = new Estimate("6-0");

        Assert.Equal("devis_6-0.pdf", estimate.GetFileName());
        Assert.Matches(new Regex("^devis_[0-9]+-[0-9]+\\.pdf$"), estimate.GetFileName());
    }

    [Fact]
    public void DocumentNamesKeepNoTraceOfTheOldEnglishConventions()
    {
        var names = new[]
        {
            new Invoice(12, issuer: null, issuedOn: default, PaymentType.BankTransfer, dueDays: 30, partyName: "Client").GetFileName(),
            new Estimate("12-1").GetFileName(),
        };

        Assert.All(names, name =>
        {
            Assert.DoesNotContain("invoice_nr_", name);
            Assert.DoesNotContain("estimate_nr_", name);
            Assert.DoesNotContain("offer_nr_", name);
            Assert.DoesNotContain("facture-", name);
        });
    }
}
