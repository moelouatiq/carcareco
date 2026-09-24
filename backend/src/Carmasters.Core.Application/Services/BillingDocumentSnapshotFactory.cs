using System;
using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Domain;

namespace Carmasters.Core.Application.Services
{
    public static class BillingDocumentSnapshotFactory
    {
        public static BillingDocumentSnapshot Create(AppOptions options)
        {
            if (options == null) throw new ArgumentNullException(nameof(options));
            if (options.Requisites == null) throw new ArgumentException("Requisites are required.", nameof(options));
            if (options.Pricing?.Invoice == null) throw new ArgumentException("Invoice options are required.", nameof(options));

            var requisites = options.Requisites;
            var invoice = options.Pricing.Invoice;

            return new BillingDocumentSnapshot(
                requisites.Name,
                requisites.Address,
                requisites.Phone,
                requisites.Email,
                requisites.RegNr,
                requisites.KMKR,
                requisites.BankAccount,
                invoice.VatRate,
                invoice.SurCharge,
                invoice.Disclaimer,
                invoice.SignatureLine);
        }
    }
}
