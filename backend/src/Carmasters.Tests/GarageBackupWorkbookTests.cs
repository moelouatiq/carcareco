using System.Globalization;
using Carmasters.Core.Application.Backup;
using ClosedXML.Excel;
using Xunit;

namespace Carmasters.Tests;

/// <summary>
/// The workbook is built from a data object, so everything about the file it produces can be
/// asserted here without a database: the sheets it contains, what a cell's type ends up being,
/// and that a value which looks like a formula never becomes one.
/// </summary>
public sealed class GarageBackupWorkbookTests
{
    /// <summary>Values a spreadsheet would evaluate if a person typed them into a cell.</summary>
    public static TheoryData<string> FormulaLookalikes() =>
    [
        "=HYPERLINK(\"https://example.com\",\"x\")",
        "+cmd",
        "-1+2",
        "@SUM(A1:A2)",
        "\t=cmd",
        "\r=cmd",
        "\n=cmd",
    ];

    private static XLWorkbook Open(byte[] bytes) => new(new MemoryStream(bytes));

    private static GarageBackupData MinimalData() => new()
    {
        GeneratedAtUtc = new DateTime(2026, 9, 12, 8, 30, 0, DateTimeKind.Utc),
        GarageName = "Solution Mécanique",
    };

    [Fact]
    public void AnEmptyGarageStillProducesAWorkbookWithEverySheet()
    {
        var bytes = new GarageBackupWorkbook().Build(MinimalData());

        using var workbook = Open(bytes);
        Assert.Equal(GarageBackupWorkbook.SheetNames, workbook.Worksheets.Select(x => x.Name).ToArray());
    }

    [Fact]
    public void TheFileIsARealOfficeOpenXmlPackage()
    {
        var bytes = new GarageBackupWorkbook().Build(MinimalData());

        // A zip container, which is what an xlsx is, and what Excel and LibreOffice look for.
        Assert.True(bytes.Length > 0);
        Assert.Equal(0x50, bytes[0]);
        Assert.Equal(0x4B, bytes[1]);
    }

    [Theory]
    [MemberData(nameof(FormulaLookalikes))]
    public void AValueThatLooksLikeAFormulaIsStoredAsTextAndNeverEvaluated(string dangerous)
    {
        // The test is only meaningful if the value really is one a spreadsheet would evaluate.
        Assert.True(ExcelText.LooksLikeFormula(dangerous));

        var data = MinimalData();
        data.Clients = [new GarageBackupData.ClientRow { ClientId = Guid.NewGuid(), Name = dangerous }];

        var bytes = new GarageBackupWorkbook().Build(data);

        using var workbook = Open(bytes);
        var cell = workbook.Worksheet("Clients").Row(2).Cell(3);

        // The property that matters: the spreadsheet holds characters, not something to evaluate.
        Assert.Equal(XLDataType.Text, cell.DataType);
        Assert.False(cell.HasFormula);

        // The value survives too, with one transformation the file format imposes rather than
        // this code: a cell's line breaks are stored as line feeds, so a lone carriage return
        // comes back as one. Nothing else about the text changes.
        Assert.Equal(dangerous.Replace("\r\n", "\n").Replace('\r', '\n'), cell.GetString());
    }

    [Fact]
    public void NoCellAnywhereInTheWorkbookCarriesAFormula()
    {
        var data = MinimalData();
        data.Clients = [new GarageBackupData.ClientRow { ClientId = Guid.NewGuid(), Name = "=1+1", Description = "@cmd" }];
        data.Employees = [new GarageBackupData.EmployeeRow { EmployeeId = Guid.NewGuid(), LastName = "-x" }];
        data.Settings = [new GarageBackupData.SettingRow { Group = "Entreprise", Name = "Nom", Value = "+y" }];

        var bytes = new GarageBackupWorkbook().Build(data);

        using var workbook = Open(bytes);
        foreach (var sheet in workbook.Worksheets)
            foreach (var cell in sheet.CellsUsed())
                Assert.False(cell.HasFormula, $"{sheet.Name}!{cell.Address} carries a formula.");
    }

    [Fact]
    public void AmountsAreNumbersWithACurrencyFormatRatherThanText()
    {
        var data = MinimalData();
        data.DocumentLines =
        [
            new GarageBackupData.DocumentLineRow
            {
                DocumentKind = "Facture", DocumentNumber = "41", Nr = 1, Description = "Diagnostic",
                Quantity = 1m, Unit = "heure", UnitPrice = 250.50m, Discount = 0,
                Total = 250.50m, TotalWithVat = 300.60m,
            },
        ];

        var bytes = new GarageBackupWorkbook().Build(data);

        using var workbook = Open(bytes);
        var row = workbook.Worksheet("Lignes documents").Row(2);

        var unitPrice = row.Cell(9);
        Assert.Equal(XLDataType.Number, unitPrice.DataType);
        Assert.Equal(250.50m, unitPrice.GetValue<decimal>());
        Assert.Contains("MAD", unitPrice.Style.NumberFormat.Format);

        Assert.Equal(XLDataType.Number, row.Cell(11).DataType);
        Assert.Equal(250.50m, row.Cell(11).GetValue<decimal>());
        Assert.Equal(300.60m, row.Cell(12).GetValue<decimal>());
    }

    [Fact]
    public void AnInstantIsWrittenAsADateWithTheDayAndTheTime()
    {
        var data = MinimalData();
        data.Works =
        [
            new GarageBackupData.WorkRow
            {
                WorkId = Guid.NewGuid(), Number = 12,
                StartedOn = new DateTime(2026, 9, 9, 14, 5, 0),
            },
        ];

        var bytes = new GarageBackupWorkbook().Build(data);

        using var workbook = Open(bytes);
        var cell = workbook.Worksheet("Interventions").Row(2).Cell(8);

        Assert.Equal(XLDataType.DateTime, cell.DataType);
        Assert.Equal(new DateTime(2026, 9, 9, 14, 5, 0), cell.GetDateTime());
        Assert.Equal("dd/MM/yyyy HH:mm", cell.Style.DateFormat.Format);
    }

    [Fact]
    public void ABusinessDateKeepsItsOwnValueAndShowsNoTime()
    {
        var data = MinimalData();
        data.Vehicles =
        [
            new GarageBackupData.VehicleRow
            {
                VehicleId = Guid.NewGuid(), RegNr = "1234-A-56",
                ProductionDate = new DateTime(2019, 3, 1),
            },
        ];

        var bytes = new GarageBackupWorkbook().Build(data);

        using var workbook = Open(bytes);
        var cell = workbook.Worksheet("Véhicules").Row(2).Cell(13);

        Assert.Equal(XLDataType.DateTime, cell.DataType);
        Assert.Equal(new DateTime(2019, 3, 1), cell.GetDateTime());
        Assert.Equal("dd/MM/yyyy", cell.Style.DateFormat.Format);
    }

    [Fact]
    public void NoSheetOffersAColumnForCredentials()
    {
        var bytes = new GarageBackupWorkbook().Build(MinimalData());

        using var workbook = Open(bytes);
        string[] forbidden = ["password", "mot de passe", "hash", "secret", "jwt", "token", "credential"];

        foreach (var sheet in workbook.Worksheets)
            foreach (var header in sheet.Row(1).CellsUsed().Select(x => x.GetString().ToLowerInvariant()))
                Assert.DoesNotContain(header, forbidden);
    }

    [Fact]
    public void EveryHeaderRowIsFrozenSoTheColumnsStayReadableWhileScrolling()
    {
        var bytes = new GarageBackupWorkbook().Build(MinimalData());

        using var workbook = Open(bytes);
        foreach (var sheet in workbook.Worksheets)
            Assert.Equal(1, sheet.SheetView.SplitRow);
    }

    [Fact]
    public void ThePeopleSheetCarriesOnlyWhatMakesTheIdentifiersReadable()
    {
        var bytes = new GarageBackupWorkbook().Build(MinimalData());

        using var workbook = Open(bytes);
        var headers = workbook.Worksheet("Employés").Row(1).CellsUsed().Select(x => x.GetString()).ToArray();

        Assert.Equal(["employee_id", "Nom", "Prénom", "Fonction", "Entré le"], headers);
    }

    [Fact]
    public void TheSummaryCountsWhatEachSheetHolds()
    {
        var data = MinimalData();
        data.Clients =
        [
            new GarageBackupData.ClientRow { ClientId = Guid.NewGuid(), Name = "Un" },
            new GarageBackupData.ClientRow { ClientId = Guid.NewGuid(), Name = "Deux" },
        ];

        var bytes = new GarageBackupWorkbook().Build(data);

        using var workbook = Open(bytes);
        var summary = workbook.Worksheet("Résumé");
        var clientsRow = summary.CellsUsed(x => x.GetString() == "Clients").Single().WorksheetRow();

        Assert.Equal(2, clientsRow.Cell(2).GetValue<int>());
    }

    [Fact]
    public void TheFileNameCarriesTheDayAndTimeItWasTaken()
    {
        var name = GarageBackupFile.NameFor(new DateTime(2026, 9, 12, 9, 30, 0));

        Assert.Equal("Sauvegarde_Garage_2026-09-12_0930.xlsx", name);
    }

    [Fact]
    public void TheFileNameDoesNotDependOnTheHostsCulture()
    {
        var previous = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = new CultureInfo("ar-MA");
            Assert.Equal(
                "Sauvegarde_Garage_2026-09-12_0930.xlsx",
                GarageBackupFile.NameFor(new DateTime(2026, 9, 12, 9, 30, 0)));
        }
        finally
        {
            CultureInfo.CurrentCulture = previous;
        }
    }

    [Fact]
    public void TheDownloadAnnouncesItselfAsASpreadsheet()
    {
        Assert.Equal(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            GarageBackupFile.ContentType);
    }
}
