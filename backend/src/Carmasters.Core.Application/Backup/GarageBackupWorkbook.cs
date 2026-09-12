using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ClosedXML.Excel;

namespace Carmasters.Core.Application.Backup
{
    /// <summary>
    /// Turns one garage's dataset into the workbook the owner downloads.
    /// </summary>
    /// <remarks>
    /// Column widths are declared per column kind rather than measured. ClosedXML measures text
    /// with a font engine to fit a column, which costs real time over a whole workbook and buys
    /// nothing here: the goal is a file that reads well, not one that fits to the pixel.
    ///
    /// Amounts are written as numbers with a currency format, never as text, so they stay
    /// sortable and summable in the spreadsheet.
    /// </remarks>
    public sealed class GarageBackupWorkbook
    {
        /// <summary>
        /// Excel format codes are locale-invariant in the file itself: ',' marks the group
        /// separator and '.' the decimal separator, and a French spreadsheet renders them as
        /// "1 234,56 MAD". Writing French separators into the code instead would not survive.
        /// </summary>
        private const string MoneyFormat = "#,##0.00\" MAD\"";
        private const string DayFormat = "dd/MM/yyyy";
        private const string MomentFormat = "dd/MM/yyyy HH:mm";

        /// <summary>The sheets in the order they appear, and the order the tests expect.</summary>
        public static readonly string[] SheetNames =
        {
            "Résumé", "Clients", "Véhicules", "Interventions", "Activités", "Devis", "Factures",
            "Lignes atelier", "Lignes documents", "Stock", "Employés", "Paramètres",
        };

        /// <summary>What a column holds, which fixes its width and its number format.</summary>
        private enum Kind { Id, Label, Name, Phone, Plate, Description, Notes, Day, Moment, Money, Count, Flag }

        private static double WidthOf(Kind kind) => kind switch
        {
            Kind.Id => 36,
            Kind.Name => 30,
            Kind.Phone => 18,
            Kind.Plate => 18,
            Kind.Description => 45,
            Kind.Notes => 50,
            Kind.Day => 16,
            Kind.Moment => 20,
            Kind.Money => 16,
            Kind.Count => 12,
            Kind.Flag => 12,
            _ => 22,
        };

        public byte[] Build(GarageBackupData data)
        {
            if (data == null) throw new ArgumentNullException(nameof(data));

            using var workbook = new XLWorkbook();

            WriteSummary(workbook, data);
            WriteClients(workbook, data);
            WriteVehicles(workbook, data);
            WriteWorks(workbook, data);
            WriteActivities(workbook, data);
            WriteEstimates(workbook, data);
            WriteInvoices(workbook, data);
            WriteWorkshopLines(workbook, data);
            WriteDocumentLines(workbook, data);
            WriteSpareParts(workbook, data);
            WriteEmployees(workbook, data);
            WriteSettings(workbook, data);

            using var buffer = new MemoryStream();
            workbook.SaveAs(buffer);
            return buffer.ToArray();
        }

        // ---- sheets --------------------------------------------------------------------------

        private static void WriteSummary(XLWorkbook workbook, GarageBackupData data)
        {
            var counts = new (string Sheet, int Rows)[]
            {
                ("Clients", data.Clients.Count),
                ("Véhicules", data.Vehicles.Count),
                ("Interventions", data.Works.Count),
                ("Activités", data.Activities.Count),
                ("Devis", data.Estimates.Count),
                ("Factures", data.Invoices.Count),
                ("Lignes atelier", data.WorkshopLines.Count),
                ("Lignes documents", data.DocumentLines.Count),
                ("Stock", data.SpareParts.Count),
                ("Employés", data.Employees.Count),
                ("Paramètres", data.Settings.Count),
            };

            var sheet = new Sheet(workbook, SheetNames[0],
                ("Information", Kind.Name), ("Valeur", Kind.Description));

            sheet.Row().Text("Garage").Text(data.GarageName);
            sheet.Row().Text("Sauvegarde générée le")
                 .Moment(TimeZoneInfo.ConvertTimeFromUtc(data.GeneratedAtUtc, GarageTimeZone()));
            sheet.Row().Text("Contenu").Text("Données métier du garage : clients, véhicules, "
                + "interventions, activités, devis, factures, lignes, stock, employés, paramètres.");
            sheet.Row().Text("Non inclus").Text("Aucune donnée d'authentification : ni identifiants, "
                + "ni mots de passe, ni secrets techniques.");
            sheet.Row();

            sheet.Row().Text("Onglet").Text("Nombre de lignes");
            foreach (var (name, rows) in counts) sheet.Row().Text(name).Count(rows);

            sheet.Finish(autoFilter: false);
        }

        private static void WriteClients(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[1],
                ("client_id", Kind.Id), ("Type", Kind.Label), ("Nom", Kind.Name),
                ("Numéro de registre", Kind.Label), ("Identifiant personnel", Kind.Label),
                ("Téléphone", Kind.Phone), ("E-mails", Kind.Description), ("Adresse", Kind.Description),
                ("Ville", Kind.Name), ("Code postal", Kind.Count), ("Région", Kind.Name),
                ("Pays", Kind.Name), ("Description", Kind.Notes), ("Créé le", Kind.Moment));

            foreach (var c in data.Clients)
                sheet.Row().Id(c.ClientId).Text(c.Kind).Text(c.Name).Text(c.RegNr).Text(c.PersonalCode)
                     .Text(c.Phone).Text(c.Emails).Text(c.Address).Text(c.City).Text(c.PostalCode)
                     .Text(c.Region).Text(c.Country).Text(c.Description).Moment(c.IntroducedAt);

            sheet.Finish();
        }

        private static void WriteVehicles(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[2],
                ("vehicle_id", Kind.Id), ("Immatriculation", Kind.Plate), ("Marque", Kind.Name),
                ("Modèle", Kind.Name), ("VIN", Kind.Label), ("Kilométrage", Kind.Count),
                ("Carrosserie", Kind.Name), ("Moteur", Kind.Name), ("Transmission", Kind.Name),
                ("Conduite", Kind.Label), ("Série", Kind.Label), ("Région", Kind.Name),
                ("Date de production", Kind.Day), ("Description", Kind.Notes),
                ("client_id", Kind.Id), ("Propriétaire", Kind.Name), ("Créé le", Kind.Moment));

            foreach (var v in data.Vehicles)
                sheet.Row().Id(v.VehicleId).Text(v.RegNr).Text(v.Producer).Text(v.Model).Text(v.Vin)
                     .Count(v.Odo).Text(v.Body).Text(v.Engine).Text(v.Transmission).Text(v.DrivingSide)
                     .Text(v.Series).Text(v.Region).Day(v.ProductionDate).Text(v.Description)
                     .Id(v.ClientId).Text(v.OwnerName).Moment(v.IntroducedAt);

            sheet.Finish();
        }

        private static void WriteWorks(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[3],
                ("work_id", Kind.Id), ("Intervention n°", Kind.Count), ("Statut enregistré", Kind.Label),
                ("client_id", Kind.Id), ("Client", Kind.Name), ("vehicle_id", Kind.Id),
                ("Véhicule", Kind.Name), ("Ouverte le", Kind.Moment), ("Terminée le", Kind.Moment),
                ("Modifiée le", Kind.Moment), ("Kilométrage", Kind.Count), ("Ouverte par", Kind.Name),
                ("Terminée par", Kind.Name), ("Mécaniciens", Kind.Description),
                ("invoice_id", Kind.Id), ("Facture n°", Kind.Count), ("Notes", Kind.Notes));

            foreach (var w in data.Works)
                sheet.Row().Id(w.WorkId).Count(w.Number).Text(w.Status).Id(w.ClientId).Text(w.ClientName)
                     .Id(w.VehicleId).Text(w.VehicleLabel).Moment(w.StartedOn).Moment(w.CompletedOn)
                     .Moment(w.ChangedOn).Count(w.Odo).Text(w.StarterName).Text(w.CompleterName)
                     .Text(w.Mechanics).Id(w.InvoiceId).Count(w.InvoiceNumber).Text(w.Notes);

            sheet.Finish();
        }

        private static void WriteActivities(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[4],
                ("activity_id", Kind.Id), ("Type", Kind.Label), ("work_id", Kind.Id),
                ("Intervention n°", Kind.Count), ("Ordre", Kind.Count), ("Démarrée le", Kind.Moment),
                ("Démarrée par", Kind.Name), ("estimate_id", Kind.Id), ("Devis n°", Kind.Label),
                ("Acceptée le", Kind.Moment), ("Acceptée par", Kind.Name), ("Notes", Kind.Notes));

            foreach (var a in data.Activities)
                sheet.Row().Id(a.ActivityId).Text(a.Kind).Id(a.WorkId).Count(a.WorkNumber)
                     .Count(a.OrderNr).Moment(a.StartedOn).Text(a.StarterName).Id(a.EstimateId)
                     .Text(a.EstimateNumber).Moment(a.AcceptedOn).Text(a.AcceptorName).Text(a.Notes);

            sheet.Finish();
        }

        private static void WriteEstimates(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[5],
                ("estimate_id", Kind.Id), ("Devis n°", Kind.Label), ("work_id", Kind.Id),
                ("Intervention n°", Kind.Count), ("Émis le", Kind.Moment), ("Envoyé le", Kind.Moment),
                ("Imprimé le", Kind.Moment), ("Destinataire", Kind.Name), ("Adresse", Kind.Description),
                ("Identifiant destinataire", Kind.Label), ("E-mail", Kind.Name),
                ("Véhicule", Kind.Description), ("Émis par", Kind.Name),
                ("Total HT des lignes", Kind.Money), ("Total TTC des lignes", Kind.Money));

            foreach (var e in data.Estimates)
                sheet.Row().Id(e.EstimateId).Text(e.Number).Id(e.WorkId).Count(e.WorkNumber)
                     .Moment(e.IssuedOn).Moment(e.SentOn).Moment(e.PrintedOn).Text(e.PartyName)
                     .Text(e.PartyAddress).Text(e.PartyCode).Text(e.Email).Text(e.VehicleLines)
                     .Text(e.IssuerName).Money(e.LinesTotal).Money(e.LinesTotalWithVat);

            sheet.Finish();
        }

        private static void WriteInvoices(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[6],
                ("invoice_id", Kind.Id), ("Facture n°", Kind.Count), ("work_id", Kind.Id),
                ("Intervention n°", Kind.Count), ("Émise le", Kind.Moment), ("Envoyée le", Kind.Moment),
                ("Imprimée le", Kind.Moment), ("Mode de paiement", Kind.Name),
                ("Délai de paiement (jours)", Kind.Count), ("Payée", Kind.Flag), ("Créditée", Kind.Flag),
                ("Destinataire", Kind.Name), ("Adresse", Kind.Description),
                ("Identifiant destinataire", Kind.Label), ("E-mail", Kind.Name),
                ("Véhicule", Kind.Description), ("Émise par", Kind.Name),
                ("Total HT des lignes", Kind.Money), ("Total TTC des lignes", Kind.Money));

            foreach (var i in data.Invoices)
                sheet.Row().Id(i.InvoiceId).Count(i.Number).Id(i.WorkId).Count(i.WorkNumber)
                     .Moment(i.IssuedOn).Moment(i.SentOn).Moment(i.PrintedOn).Text(i.PaymentType)
                     .Count(i.DueDays).Flag(i.IsPaid).Flag(i.IsCredited).Text(i.PartyName)
                     .Text(i.PartyAddress).Text(i.PartyCode).Text(i.Email).Text(i.VehicleLines)
                     .Text(i.IssuerName).Money(i.LinesTotal).Money(i.LinesTotalWithVat);

            sheet.Finish();
        }

        private static void WriteWorkshopLines(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[7],
                ("Type", Kind.Name), ("work_id", Kind.Id), ("Intervention n°", Kind.Count),
                ("activity_id", Kind.Id), ("Rang", Kind.Count), ("Référence", Kind.Label),
                ("Désignation", Kind.Description), ("Quantité", Kind.Count), ("Unité", Kind.Label),
                ("Prix unitaire", Kind.Money), ("Remise (%)", Kind.Count), ("État de la pièce", Kind.Name),
                ("Mécanicien", Kind.Name), ("Notes", Kind.Notes));

            foreach (var l in data.WorkshopLines)
                sheet.Row().Text(l.Kind).Id(l.WorkId).Count(l.WorkNumber).Id(l.ActivityId)
                     .Count(l.Jnr).Text(l.Code).Text(l.Name).Quantity(l.Quantity).Text(l.Unit)
                     .Money(l.Price).Count(l.Discount).Text(l.InstallStatus).Text(l.MechanicName)
                     .Text(l.Notes);

            sheet.Finish();
        }

        private static void WriteDocumentLines(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[8],
                ("Document", Kind.Label), ("Numéro", Kind.Label), ("estimate_id", Kind.Id),
                ("invoice_id", Kind.Id), ("Rang", Kind.Count), ("Description", Kind.Description),
                ("Quantité", Kind.Count), ("Unité", Kind.Label), ("Prix unitaire", Kind.Money),
                ("Remise (%)", Kind.Count), ("Total HT", Kind.Money), ("Total TTC", Kind.Money));

            foreach (var l in data.DocumentLines)
                sheet.Row().Text(l.DocumentKind).Text(l.DocumentNumber).Id(l.EstimateId).Id(l.InvoiceId)
                     .Count(l.Nr).Text(l.Description).Quantity(l.Quantity).Text(l.Unit)
                     .Money(l.UnitPrice).Count(l.Discount).Money(l.Total).Money(l.TotalWithVat);

            sheet.Finish();
        }

        private static void WriteSpareParts(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[9],
                ("sparepart_id", Kind.Id), ("Référence", Kind.Label), ("Désignation", Kind.Description),
                ("Prix", Kind.Money), ("Quantité", Kind.Count), ("Remise (%)", Kind.Count),
                ("storage_id", Kind.Id), ("Emplacement", Kind.Name), ("Adresse", Kind.Description),
                ("Tarif de référence", Kind.Name), ("Prix de référence", Kind.Money),
                ("Description", Kind.Notes), ("Créé le", Kind.Moment));

            foreach (var s in data.SpareParts)
                sheet.Row().Id(s.SparePartId).Text(s.Code).Text(s.Name).Money(s.Price)
                     .Quantity(s.Quantity).Count(s.Discount).Id(s.StorageId).Text(s.StorageName)
                     .Text(s.StorageAddress).Text(s.ReferencePriceName).Money(s.ReferencePrice)
                     .Text(s.Description).Moment(s.IntroducedAt);

            sheet.Finish();
        }

        private static void WriteEmployees(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[10],
                ("employee_id", Kind.Id), ("Nom", Kind.Name), ("Prénom", Kind.Name),
                ("Fonction", Kind.Name), ("Entré le", Kind.Day));

            foreach (var e in data.Employees)
                sheet.Row().Id(e.EmployeeId).Text(e.LastName).Text(e.FirstName).Text(e.Profession)
                     .Day(e.IntroducedAt);

            sheet.Finish();
        }

        private static void WriteSettings(XLWorkbook workbook, GarageBackupData data)
        {
            var sheet = new Sheet(workbook, SheetNames[11],
                ("Groupe", Kind.Name), ("Paramètre", Kind.Name), ("Valeur", Kind.Notes));

            foreach (var s in data.Settings)
                sheet.Row().Text(s.Group).Text(s.Name).Text(s.Value);

            sheet.Finish();
        }

        /// <summary>
        /// The garage's zone, falling back to UTC on a host whose zone database does not carry it
        /// rather than failing the whole download.
        /// </summary>
        private static TimeZoneInfo GarageTimeZone()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById("Africa/Casablanca"); }
            catch (TimeZoneNotFoundException) { return TimeZoneInfo.Utc; }
            catch (InvalidTimeZoneException) { return TimeZoneInfo.Utc; }
        }

        /// <summary>
        /// A sheet being filled in, with a cursor so a row's values cannot drift out of step with
        /// the headers they were declared against.
        /// </summary>
        private sealed class Sheet
        {
            private readonly IXLWorksheet sheet;
            private readonly int columnCount;
            private int row;
            private int column;

            public Sheet(XLWorkbook workbook, string name, params (string Header, Kind Kind)[] columns)
            {
                sheet = workbook.Worksheets.Add(name);
                columnCount = columns.Length;

                for (var i = 0; i < columns.Length; i++)
                {
                    sheet.Cell(1, i + 1).WriteText(columns[i].Header);
                    sheet.Column(i + 1).Width = WidthOf(columns[i].Kind);
                }

                sheet.Row(1).Style.Font.Bold = true;
                row = 1;
            }

            public Sheet Row()
            {
                row++;
                column = 0;
                return this;
            }

            private IXLCell Next() => sheet.Cell(row, ++column);

            public Sheet Text(string value) { Next().WriteText(value); return this; }

            public Sheet Id(Guid? value)
            {
                if (value.HasValue) Next().WriteText(value.Value.ToString());
                else Next();
                return this;
            }

            public Sheet Id(Guid value) => Id((Guid?)value);

            public Sheet Money(decimal? value)
            {
                var cell = Next();
                if (value.HasValue)
                {
                    cell.Value = value.Value;
                    cell.Style.NumberFormat.Format = MoneyFormat;
                }
                return this;
            }

            public Sheet Quantity(decimal? value)
            {
                var cell = Next();
                if (value.HasValue) cell.Value = value.Value;
                return this;
            }

            public Sheet Count(int? value)
            {
                var cell = Next();
                if (value.HasValue) cell.Value = value.Value;
                return this;
            }

            public Sheet Count(short? value) => Count(value.HasValue ? value.Value : (int?)null);

            public Sheet Flag(bool? value) => Text(value.HasValue ? (value.Value ? "Oui" : "Non") : null);

            /// <summary>A real instant, shown on the garage's clock.</summary>
            public Sheet Moment(DateTime? value)
            {
                var cell = Next();
                if (value.HasValue)
                {
                    cell.Value = value.Value;
                    cell.Style.DateFormat.Format = MomentFormat;
                }
                return this;
            }

            /// <summary>A business date, kept exactly as stored.</summary>
            public Sheet Day(DateTime? value)
            {
                var cell = Next();
                if (value.HasValue)
                {
                    cell.Value = value.Value;
                    cell.Style.DateFormat.Format = DayFormat;
                }
                return this;
            }

            public void Finish(bool autoFilter = true)
            {
                sheet.SheetView.FreezeRows(1);
                if (autoFilter && columnCount > 0)
                    sheet.Range(1, 1, Math.Max(row, 1), columnCount).SetAutoFilter();
            }
        }
    }
}
