using System.Globalization;
using System.Linq;
using Carmasters.Core.Application.Printing;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// What a printed document says, asserted without rendering one.
/// </summary>
public sealed class PricingDisplayTests
{
    [Theory]
    [InlineData(3, "000003")]
    [InlineData(12, "000012")]
    [InlineData(1, "000001")]
    [InlineData(123456, "123456")]
    public void AnInvoiceNumberIsPrintedOnSixPositions(int number, string expected)
    {
        Assert.Equal(expected, PricingDisplay.InvoiceNumber(number));
    }

    [Fact]
    public void ANumberTooLargeForSixPositionsIsPrintedWholeRatherThanCut()
    {
        // Padding must never lose a digit: an invoice is a legal document.
        Assert.Equal("1234567", PricingDisplay.InvoiceNumber(1234567));
    }

    [Fact]
    public void PaddingIsPresentationOnly()
    {
        // The domain keeps the int it sequences; only the paper shows the zeros.
        const int stored = 3;

        Assert.Equal("000003", PricingDisplay.InvoiceNumber(stored));
        Assert.Equal(3, stored);
    }

    [Fact]
    public void TheDateReadsAsFrenchProse()
    {
        Assert.Equal("28 août 2025", PricingDisplay.LongDate(new DateTime(2025, 8, 28)));
    }

    [Fact]
    public void TheDateDoesNotDependOnTheHostCulture()
    {
        // Containers run under InvariantCulture, which would otherwise print "28 August 2025".
        var previous = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
            Assert.Equal("1 janvier 2026", PricingDisplay.LongDate(new DateTime(2026, 1, 1)));
        }
        finally
        {
            CultureInfo.CurrentCulture = previous;
        }
    }

    /// <summary>
    /// Which space .NET puts between thousands is its business -- recent versions use a narrow
    /// no-break space rather than a plain one -- so the assertion is on what a reader sees: the
    /// digits, a comma before the centimes, and a separator that is some kind of space.
    /// </summary>
    private static string WithoutSpaces(string value) =>
        new string(value.Where(c => !char.IsWhiteSpace(c)).ToArray());

    [Fact]
    public void AmountsCarryTheFrenchSeparatorsAndTheCurrency()
    {
        Assert.Equal("1000,00MAD", WithoutSpaces(PricingDisplay.Money(1000m)));
        Assert.Equal("1250,50MAD", WithoutSpaces(PricingDisplay.Money(1250.5m)));
        Assert.Equal("0,00MAD", WithoutSpaces(PricingDisplay.Money(0m)));
    }

    [Fact]
    public void ThousandsAreSeparatedRatherThanRunTogether()
    {
        var printed = PricingDisplay.Amount(1000m);

        Assert.Matches(@"^1\s000,00$", printed);
        Assert.Contains(",", printed);
        Assert.DoesNotContain(".", printed);
    }

    [Fact]
    public void AColumnThatNamesItsCurrencyOnceLeavesItOffEachRow()
    {
        Assert.Equal("1000,00", WithoutSpaces(PricingDisplay.Amount(1000m)));
        Assert.DoesNotContain("MAD", PricingDisplay.Amount(1000m));
    }

    [Fact]
    public void AQuantityKeepsItsOwnPrecision()
    {
        Assert.Equal("2", PricingDisplay.Number(2m));
        Assert.Equal("2,5", PricingDisplay.Number(2.5m));
        Assert.Equal(string.Empty, PricingDisplay.Number(null));
    }

    [Theory]
    [InlineData("Véhicule : Renault Express")]
    [InlineData("Immatriculation : 1234-A-56")]
    [InlineData("Kilométrage : 0")]
    [InlineData("VIN : VF1TEST0000000002")]
    public void AVehicleLineWithAValueIsPrinted(string line)
    {
        Assert.True(PricingDisplay.Says(line));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void AnEmptyVehicleLineIsNotPrinted(string? line)
    {
        Assert.False(PricingDisplay.Says(line));
    }

    [Theory]
    [InlineData("VIN :")]
    [InlineData("VIN : ")]
    [InlineData("Kilométrage : ")]
    [InlineData("Véhicule :  ")]
    public void AVehicleLineThatIsOnlyItsLabelIsNotPrinted(string line)
    {
        // The domain writes "Kilométrage : " + Odo, and Odo is nullable: a vehicle with no
        // recorded mileage produces a line that is not empty but says nothing. Printing it would
        // put a bare label on the invoice.
        Assert.False(PricingDisplay.Says(line));
    }

    [Fact]
    public void AZeroMileageIsAValueAndSurvives()
    {
        // 0 km is a real reading, unlike a missing one.
        Assert.True(PricingDisplay.Says("Kilométrage : 0"));
    }
}
