using Carmasters.Core.Domain;

namespace Carmasters.Http.Api.Model
{
    /// <summary>
    /// What the garage chose in the dialog that ends a job and issues its invoice.
    /// </summary>
    /// <remarks>
    /// ShowVehicleOnInvoice decides only what this invoice captures as it is issued; it changes
    /// nothing about any document already sent.
    /// </remarks>
    public record  IssueInvoiceDto(PaymentType PaymentType, short DueDays, bool SendClientEmail, string ClientEmail, bool ShowVehicleOnInvoice);
}
