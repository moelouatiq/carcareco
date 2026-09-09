using System;
using System.Collections.Generic;

namespace Carmasters.Http.Api.Models
{
    public record ServiceHistoryLineDto(
        Guid Id,
        string Code,
        string Name,
        decimal? Quantity,
        string Unit,
        decimal UnitPrice,
        short? Discount);

    public record ServiceHistoryItemDto(
        Guid WorkId,
        int WorkNumber,
        DateTime OpenedOn,
        DateTime? ClosedOn,
        string Status,
        Guid? ClientId,
        string ClientName,
        Guid? VehicleId,
        string Registration,
        string VehicleMake,
        string VehicleModel,
        int? Odometer,
        string Summary,
        IReadOnlyList<ServiceHistoryLineDto> Labor,
        IReadOnlyList<ServiceHistoryLineDto> Parts,
        decimal? TotalAmount,
        string Currency,
        int? InvoiceNumber,
        Guid? InvoiceId,
        bool HasInvoice);

    public record ServiceHistoryPageDto(
        int TotalCount,
        decimal TotalInvoiced,
        DateTime? LastServiceDate,
        int? LastRecordedOdometer,
        int Offset,
        int Limit,
        bool HasMore,
        IReadOnlyList<ServiceHistoryItemDto> Items);
}
