using System;
using System.Collections.Generic;

namespace Carmasters.Core.Application.Backup
{
    /// <summary>
    /// Everything one garage's workbook contains, read in bulk before any of it is written.
    /// </summary>
    /// <remarks>
    /// Money is carried as decimal even though the columns behind it are double precision: the
    /// workbook must not hand Excel a binary float where the owner expects an amount. No total is
    /// derived here. The application computes line totals in PriceSummary with rules a SQL SUM
    /// would not reproduce -- the discount is additive so a reduction is stored negative, the
    /// price already includes VAT, and a quantity below one collapses the total to zero -- so the
    /// workshop lines carry only their stored fields, and the only totals in the file are the
    /// frozen ones PricingLine already holds.
    /// </remarks>
    public sealed class GarageBackupData
    {
        public DateTime GeneratedAtUtc { get; set; }
        public string GarageName { get; set; }

        public IReadOnlyList<ClientRow> Clients { get; set; } = new List<ClientRow>();
        public IReadOnlyList<VehicleRow> Vehicles { get; set; } = new List<VehicleRow>();
        public IReadOnlyList<WorkRow> Works { get; set; } = new List<WorkRow>();
        public IReadOnlyList<ActivityRow> Activities { get; set; } = new List<ActivityRow>();
        public IReadOnlyList<EstimateRow> Estimates { get; set; } = new List<EstimateRow>();
        public IReadOnlyList<InvoiceRow> Invoices { get; set; } = new List<InvoiceRow>();
        public IReadOnlyList<WorkshopLineRow> WorkshopLines { get; set; } = new List<WorkshopLineRow>();
        public IReadOnlyList<DocumentLineRow> DocumentLines { get; set; } = new List<DocumentLineRow>();
        public IReadOnlyList<SparePartRow> SpareParts { get; set; } = new List<SparePartRow>();
        public IReadOnlyList<EmployeeRow> Employees { get; set; } = new List<EmployeeRow>();
        public IReadOnlyList<SettingRow> Settings { get; set; } = new List<SettingRow>();

        public sealed class ClientRow
        {
            public Guid ClientId { get; set; }
            public string Kind { get; set; }
            public string Name { get; set; }
            public string RegNr { get; set; }
            public string PersonalCode { get; set; }
            public string Phone { get; set; }
            public string Emails { get; set; }
            public string Address { get; set; }
            public string City { get; set; }
            public string PostalCode { get; set; }
            public string Region { get; set; }
            public string Country { get; set; }
            public string Description { get; set; }
            public DateTime? IntroducedAt { get; set; }
        }

        public sealed class VehicleRow
        {
            public Guid VehicleId { get; set; }
            public string RegNr { get; set; }
            public string Producer { get; set; }
            public string Model { get; set; }
            public string Vin { get; set; }
            public int? Odo { get; set; }
            public string Body { get; set; }
            public string Engine { get; set; }
            public string Transmission { get; set; }
            public string DrivingSide { get; set; }
            public string Series { get; set; }
            public string Region { get; set; }
            /// <summary>A plain date column: no time zone is applied to it.</summary>
            public DateTime? ProductionDate { get; set; }
            public string Description { get; set; }
            public Guid? ClientId { get; set; }
            public string OwnerName { get; set; }
            public DateTime? IntroducedAt { get; set; }
        }

        public sealed class WorkRow
        {
            public Guid WorkId { get; set; }
            public int Number { get; set; }
            public Guid? ClientId { get; set; }
            public string ClientName { get; set; }
            public Guid? VehicleId { get; set; }
            public string VehicleLabel { get; set; }
            public string Status { get; set; }
            public DateTime? StartedOn { get; set; }
            public DateTime? CompletedOn { get; set; }
            public DateTime? ChangedOn { get; set; }
            public int? Odo { get; set; }
            public string StarterName { get; set; }
            public string CompleterName { get; set; }
            public string Mechanics { get; set; }
            public Guid? InvoiceId { get; set; }
            public int? InvoiceNumber { get; set; }
            public string Notes { get; set; }
        }

        public sealed class ActivityRow
        {
            public Guid ActivityId { get; set; }
            public string Kind { get; set; }
            public Guid WorkId { get; set; }
            public int WorkNumber { get; set; }
            public short OrderNr { get; set; }
            public DateTime? StartedOn { get; set; }
            public string StarterName { get; set; }
            public Guid? EstimateId { get; set; }
            public string EstimateNumber { get; set; }
            public DateTime? AcceptedOn { get; set; }
            public string AcceptorName { get; set; }
            public string Notes { get; set; }
        }

        public sealed class EstimateRow
        {
            public Guid EstimateId { get; set; }
            public string Number { get; set; }
            public Guid? WorkId { get; set; }
            public int? WorkNumber { get; set; }
            public DateTime? IssuedOn { get; set; }
            public DateTime? SentOn { get; set; }
            public DateTime? PrintedOn { get; set; }
            public string PartyName { get; set; }
            public string PartyAddress { get; set; }
            public string PartyCode { get; set; }
            public string Email { get; set; }
            public string VehicleLines { get; set; }
            public string IssuerName { get; set; }
            public decimal? LinesTotal { get; set; }
            public decimal? LinesTotalWithVat { get; set; }
        }

        public sealed class InvoiceRow
        {
            public Guid InvoiceId { get; set; }
            public int Number { get; set; }
            public Guid? WorkId { get; set; }
            public int? WorkNumber { get; set; }
            public DateTime? IssuedOn { get; set; }
            public DateTime? SentOn { get; set; }
            public DateTime? PrintedOn { get; set; }
            public string PaymentType { get; set; }
            public short DueDays { get; set; }
            public bool IsPaid { get; set; }
            public bool? IsCredited { get; set; }
            public string PartyName { get; set; }
            public string PartyAddress { get; set; }
            public string PartyCode { get; set; }
            public string Email { get; set; }
            public string VehicleLines { get; set; }
            public string IssuerName { get; set; }
            public decimal? LinesTotal { get; set; }
            public decimal? LinesTotalWithVat { get; set; }
        }

        public sealed class WorkshopLineRow
        {
            public Guid LineId { get; set; }
            public string Kind { get; set; }
            public Guid WorkId { get; set; }
            public int WorkNumber { get; set; }
            public Guid ActivityId { get; set; }
            public short? Jnr { get; set; }
            public string Code { get; set; }
            public string Name { get; set; }
            public decimal? Quantity { get; set; }
            public string Unit { get; set; }
            public decimal? Price { get; set; }
            public short? Discount { get; set; }
            public string InstallStatus { get; set; }
            public string MechanicName { get; set; }
            public string Notes { get; set; }
        }

        public sealed class DocumentLineRow
        {
            public string DocumentKind { get; set; }
            public string DocumentNumber { get; set; }
            public Guid? EstimateId { get; set; }
            public Guid? InvoiceId { get; set; }
            public short Nr { get; set; }
            public string Description { get; set; }
            public decimal? Quantity { get; set; }
            public string Unit { get; set; }
            public decimal? UnitPrice { get; set; }
            public short Discount { get; set; }
            public decimal? Total { get; set; }
            public decimal? TotalWithVat { get; set; }
        }

        public sealed class SparePartRow
        {
            public Guid SparePartId { get; set; }
            public string Code { get; set; }
            public string Name { get; set; }
            public decimal? Price { get; set; }
            public decimal? Quantity { get; set; }
            public short? Discount { get; set; }
            public Guid? StorageId { get; set; }
            public string StorageName { get; set; }
            public string StorageAddress { get; set; }
            public string ReferencePriceName { get; set; }
            public decimal? ReferencePrice { get; set; }
            public string Description { get; set; }
            public DateTime? IntroducedAt { get; set; }
        }

        public sealed class EmployeeRow
        {
            public Guid EmployeeId { get; set; }
            public string LastName { get; set; }
            public string FirstName { get; set; }
            public string Profession { get; set; }
            public DateTime? IntroducedAt { get; set; }
        }

        public sealed class SettingRow
        {
            public string Group { get; set; }
            public string Name { get; set; }
            public string Value { get; set; }
        }
    }
}
