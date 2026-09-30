using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.Model;
using Carmasters.Core.Application.Printing;
using Carmasters.Core.Application.Services;
using Carmasters.Core.Domain;
using Xunit;

namespace Carmasters.Tests;

public sealed class BillingDocumentSnapshotTests
{
    private sealed class FixedNumbers : ISequnceNumberProviderFactory, ISequencedNumberProvider
    {
        public ISequencedNumberProvider GetNumberProvider<T>() => this;
        public int Next() => 42;
    }

    private sealed class CapturingTemplateService : ITemplateService
    {
        public PricingPrintModel Model { get; private set; } = null!;

        public Task<string> RenderAsync<TViewModel>(string filename, TViewModel viewModel)
        {
            Model = Assert.IsType<PricingPrintModel>(viewModel);
            return Task.FromResult(filename);
        }
    }

    private sealed class MutableTenantConfigService : ITenantConfigService
    {
        public MutableTenantConfigService(AppOptions current) => Current = current;

        public AppOptions Current { get; set; }
        public int RequisitesReads { get; private set; }
        public int PricingReads { get; private set; }

        public Task<RequisitesOptions> GetRequisitesAsync()
        {
            RequisitesReads++;
            return Task.FromResult(Current.Requisites);
        }

        public Task<PricingOptions> GetPricingAsync()
        {
            PricingReads++;
            return Task.FromResult(Current.Pricing);
        }

        public Task<AppOptions> GetAppOptionsAsync() => Task.FromResult(Current);
        public Task SaveRequisitesAsync(RequisitesOptions requisitesOptions) => throw new NotSupportedException();
        public Task SavePricingAsync(PricingOptions pricingOptions) => throw new NotSupportedException();
        public Task SaveAppOptionsAsync(AppOptions appOptions) => throw new NotSupportedException();
    }

    private static readonly AppOptions GarageA = new(
        new RequisitesOptions(
            "Garage A", "Phone A", "Address A", "Email A", "Bank A", "Reg A", "ICE-A"),
        new PricingOptions(
            new InvoiceOptions(0, "Penalty A", "Mention A", true, "Invoice mail A"),
            new EstimateOptions("Estimate mail A")));

    private static readonly AppOptions GarageB = new(
        new RequisitesOptions(
            "Garage B", "Phone B", "Address B", "Email B", "Bank B", "Reg B", "ICE-B"),
        new PricingOptions(
            new InvoiceOptions(20, "Penalty B", "Mention B", false, "Invoice mail B"),
            new EstimateOptions("Estimate mail B")));

    private static Employee Issuer() =>
        new("Billing", "Tester", DateTime.UtcNow);

    private static Work NewWork(Employee issuer) =>
        new(17, DateTime.UtcNow, issuer);

    private static async Task<PricingPrintModel> RenderAsync(
        Pricing pricing,
        MutableTenantConfigService tenantConfig)
    {
        var template = new CapturingTemplateService();
        var generator = new PricingBodyHtmlGenerator(template, tenantConfig);

        await generator.Generate(pricing);

        return template.Model;
    }

    private static void AssertGarageA(Pricing pricing, PricingPrintModel model)
    {
        var snapshot = Assert.IsType<BillingDocumentSnapshot>(pricing.DocumentSnapshot);
        Assert.Equal("Garage A", snapshot.IssuerName);
        Assert.Equal("Address A", snapshot.IssuerAddress);
        Assert.Equal("Phone A", snapshot.IssuerPhone);
        Assert.Equal("Email A", snapshot.IssuerEmail);
        Assert.Equal("Reg A", snapshot.IssuerRegNr);
        Assert.Equal("ICE-A", snapshot.IssuerKmkr);
        Assert.Equal("Bank A", snapshot.IssuerBankAccount);
        Assert.Equal(0, snapshot.VatRate);
        Assert.Equal("Penalty A", snapshot.SurCharge);
        Assert.Equal("Mention A", snapshot.Disclaimer);
        Assert.True(snapshot.SignatureLine);

        Assert.Equal("Garage A", model.RequisitesOptions.Name);
        Assert.Equal("ICE-A", model.RequisitesOptions.KMKR);
        Assert.Equal("Penalty A", model.PricingOptions.Invoice.SurCharge);
        Assert.Equal("Mention A", model.PricingOptions.Invoice.Disclaimer);
        Assert.Equal(0, model.PricingOptions.Invoice.VatRate);
        Assert.True(model.PricingOptions.Invoice.SignatureLine);
    }

    [Fact]
    public async Task InvoiceKeepsGarageAAfterTenantChangesToGarageB()
    {
        var tenantConfig = new MutableTenantConfigService(GarageA);
        var issuer = Issuer();
        var work = NewWork(issuer);
        var issuedSnapshot = BillingDocumentSnapshotFactory.Create(await tenantConfig.GetAppOptionsAsync());

        work.GenerateInvoice(
            new FixedNumbers(), issuedSnapshot, PaymentType.Cash, dueDays: 30, issuer,
            showVehicleOnInvoice: false);

        var issued = work.Invoice;
        var reloaded = new Invoice(
            issued.Number, issued.Issuer, issued.IssuedOn, issued.PaymentType, issued.DueDays,
            issued.PartyName, issued.IsPaid, issued.IsCredited, issued.SentOn, issued.PrintedOn,
            issued.Email, issued.PartyAddress, issued.PartyCode, issued.VehicleLine1,
            issued.VehicleLine2, issued.VehicleLine3, issued.VehicleLine4, issued.Id,
            issued.DocumentSnapshot);

        tenantConfig.Current = GarageB;
        var model = await RenderAsync(reloaded, tenantConfig);

        AssertGarageA(reloaded, model);
        Assert.Equal(0, tenantConfig.RequisitesReads);
        Assert.Equal(0, tenantConfig.PricingReads);
    }

    [Fact]
    public async Task EstimateKeepsGarageAAfterTenantChangesToGarageB()
    {
        var tenantConfig = new MutableTenantConfigService(GarageA);
        var issuer = Issuer();
        var work = NewWork(issuer);
        var offer = work.CreateOffer(issuer);
        var issuedSnapshot = BillingDocumentSnapshotFactory.Create(await tenantConfig.GetAppOptionsAsync());

        var issuedOffer = await work.Issue(
            offer, sender: null, issuedSnapshot, issuer, showVehicleOnPricing: false,
            sendClientEmail: false, clientEmail: null);
        var issued = issuedOffer.Estimate;
        var reloaded = new Estimate(
            issued.Number, issued.Issuer, issued.IssuedOn, issued.PartyName, issued.SentOn,
            issued.PrintedOn, issued.Email, issued.PartyAddress, issued.PartyCode,
            issued.VehicleLine1, issued.VehicleLine2, issued.VehicleLine3, issued.VehicleLine4,
            issued.Id, issued.DocumentSnapshot);

        tenantConfig.Current = GarageB;
        var model = await RenderAsync(reloaded, tenantConfig);

        AssertGarageA(reloaded, model);
        Assert.Equal(0, tenantConfig.RequisitesReads);
        Assert.Equal(0, tenantConfig.PricingReads);
    }

    [Fact]
    public async Task LegacyDocumentFallsBackToCurrentSettingsWithoutPersistingThem()
    {
        var tenantConfig = new MutableTenantConfigService(GarageB);
        var legacy = new Invoice(
            5, Issuer(), DateTime.UtcNow, PaymentType.Cash, dueDays: 30, partyName: "Client");

        var model = await RenderAsync(legacy, tenantConfig);

        Assert.Null(legacy.DocumentSnapshot);
        Assert.Equal("Garage B", model.RequisitesOptions.Name);
        Assert.Equal("ICE-B", model.RequisitesOptions.KMKR);
        Assert.Equal("Mention B", model.PricingOptions.Invoice.Disclaimer);
        Assert.Equal(20, model.PricingOptions.Invoice.VatRate);
        Assert.False(model.PricingOptions.Invoice.SignatureLine);
        Assert.Equal(1, tenantConfig.RequisitesReads);
        Assert.Equal(1, tenantConfig.PricingReads);
        Assert.Null(legacy.DocumentSnapshot);
    }
}
