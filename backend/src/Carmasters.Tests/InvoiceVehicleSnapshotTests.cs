using Carmasters.Core.Domain;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// What an invoice captures about the vehicle when it is actually issued.
/// </summary>
/// <remarks>
/// These go through Work.GenerateInvoice, the path the endpoint takes, rather than building an
/// Invoice by hand: the defect being fixed was that the real path passed null and no test of a
/// hand-built document would ever have noticed.
/// </remarks>
public sealed class InvoiceVehicleSnapshotTests
{
    private sealed class FixedNumbers : ISequnceNumberProviderFactory, ISequencedNumberProvider
    {
        private int next = 1;
        public ISequencedNumberProvider GetNumberProvider<T>() => this;
        public int Next() => next++;
    }

    private static Employee AnEmployee() => new();

    private static BillingDocumentSnapshot BillingSnapshot() =>
        new("Garage", "Address", "Phone", "Email", "RegNr", "ICE", "Bank", 0,
            "Penalty", "Disclaimer", signatureLine: true);

    private static Vehicle AVehicle(string? vin = "VF1EXPRESS000001", int? odo = 142500) =>
        new(regNr: "4512-B-06", introducedAt: DateTime.Now, producer: "Renault", model: "Express",
            vin: vin, odo: odo);

    private static Work AJob(Vehicle vehicle) =>
        new(number: 3, startedOn: DateTime.Now, starter: AnEmployee(), vehicle: vehicle);

    private static Invoice Issue(Work work, bool showVehicleOnInvoice)
    {
        work.GenerateInvoice(new FixedNumbers(), BillingSnapshot(), PaymentType.Cash, dueDays: 30,
                             issuer: AnEmployee(), showVehicleOnInvoice: showVehicleOnInvoice);
        return work.Invoice;
    }

    // ---- A: a vehicle, and the garage chose to show it -------------------------------------
    [Fact]
    public void AnIssuedInvoiceCapturesTheVehicleWhenAsked()
    {
        var invoice = Issue(AJob(AVehicle()), showVehicleOnInvoice: true);

        Assert.Contains("Renault", invoice.VehicleLine1);
        Assert.Contains("Express", invoice.VehicleLine1);
        Assert.Contains("4512-B-06", invoice.VehicleLine2);
        Assert.Contains("142500", invoice.VehicleLine3);
        Assert.Contains("VF1EXPRESS000001", invoice.VehicleLine4);
    }

    [Fact]
    public void TheCapturedLinesCarryTheirOwnLabels()
    {
        // The document stores "Véhicule : Renault Express", which is what the PDF prints; this is
        // the shape the printing code was built against.
        var invoice = Issue(AJob(AVehicle()), showVehicleOnInvoice: true);

        Assert.StartsWith("Véhicule :", invoice.VehicleLine1);
        Assert.StartsWith("Immatriculation :", invoice.VehicleLine2);
        Assert.StartsWith("Kilométrage :", invoice.VehicleLine3);
        Assert.StartsWith("VIN :", invoice.VehicleLine4);
    }

    // ---- B: a vehicle, and the garage chose not to show it ----------------------------------
    [Fact]
    public void AnIssuedInvoiceLeavesTheVehicleOutWhenNotAsked()
    {
        var invoice = Issue(AJob(AVehicle()), showVehicleOnInvoice: false);

        Assert.Equal(string.Empty, invoice.VehicleLine1);
        Assert.Equal(string.Empty, invoice.VehicleLine2);
        Assert.Equal(string.Empty, invoice.VehicleLine3);
        Assert.Equal(string.Empty, invoice.VehicleLine4);
    }

    // ---- C: no vehicle at all ----------------------------------------------------------------
    [Fact]
    public void AJobWithNoVehicleIssuesCleanlyEvenWhenTheAnswerIsYes()
    {
        var work = new Work(number: 4, startedOn: DateTime.Now, starter: AnEmployee(), vehicle: null);

        var invoice = Issue(work, showVehicleOnInvoice: true);

        Assert.Equal(string.Empty, invoice.VehicleLine1);
        Assert.Equal(string.Empty, invoice.VehicleLine2);
        Assert.Equal(string.Empty, invoice.VehicleLine3);
        Assert.Equal(string.Empty, invoice.VehicleLine4);
    }

    // ---- D: the snapshot holds ----------------------------------------------------------------
    [Fact]
    public void AnIssuedInvoiceDoesNotFollowTheVehicleWhenItChangesLater()
    {
        var vehicle = AVehicle();
        var work = AJob(vehicle);
        var invoice = Issue(work, showVehicleOnInvoice: true);

        var asIssued = new[]
        {
            invoice.VehicleLine1, invoice.VehicleLine2, invoice.VehicleLine3, invoice.VehicleLine4,
        };

        // The car comes back six months later, re-registered and with more kilometres on it.
        vehicle.Edit(regNr: "9999-Z-99", producer: "Dacia", model: "Logan",
                     vin: "VF1LOGAN00000002", odo: 210000);

        Assert.Equal(asIssued[0], invoice.VehicleLine1);
        Assert.Equal(asIssued[1], invoice.VehicleLine2);
        Assert.Equal(asIssued[2], invoice.VehicleLine3);
        Assert.Equal(asIssued[3], invoice.VehicleLine4);

        // And specifically none of the new values leaked in.
        Assert.DoesNotContain("Dacia", invoice.VehicleLine1);
        Assert.DoesNotContain("9999-Z-99", invoice.VehicleLine2);
        Assert.DoesNotContain("210000", invoice.VehicleLine3);
    }

    // ---- the gaps the printing code has to survive -------------------------------------------
    [Fact]
    public void AVehicleWithNoVinStoresALabelWithNothingBehindIt()
    {
        // Not a defect to fix here: it is the shape the printing code already filters on, and
        // this test pins it so that filter keeps being necessary for a reason.
        var invoice = Issue(AJob(AVehicle(vin: null)), showVehicleOnInvoice: true);

        Assert.Equal("VIN : ", invoice.VehicleLine4);
        Assert.NotEqual(string.Empty, invoice.VehicleLine4);
    }

    [Fact]
    public void AVehicleWithNoMileageStoresALabelWithNothingBehindIt()
    {
        var invoice = Issue(AJob(AVehicle(odo: null)), showVehicleOnInvoice: true);

        Assert.Equal("Kilométrage : ", invoice.VehicleLine3);
    }

    // ---- the rest of the invoice is unaffected either way ------------------------------------
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void TheChoiceChangesNothingElseAboutTheInvoice(bool showVehicleOnInvoice)
    {
        var invoice = Issue(AJob(AVehicle()), showVehicleOnInvoice);

        Assert.Equal(1, invoice.Number);
        Assert.Equal(PaymentType.Cash, invoice.PaymentType);
        Assert.Equal((short)30, invoice.DueDays);
        Assert.False(invoice.IsPaid);
    }
}
