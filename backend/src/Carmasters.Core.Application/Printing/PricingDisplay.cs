using System;
using System.Globalization;

namespace Carmasters.Core.Application.Printing
{
    /// <summary>
    /// How a priced document reads on paper, kept out of the view so it can be asserted.
    /// </summary>
    /// <remarks>
    /// Every one of these is presentation only. The invoice number stored and sequenced by the
    /// domain stays an int, the file name keeps its own convention, and nothing here changes what
    /// a document holds.
    /// </remarks>
    public static class PricingDisplay
    {
        /// <summary>
        /// The container runs under InvariantCulture, so the culture is named rather than
        /// inherited: otherwise a French document prints "28 August 2025" and "1250.00".
        /// </summary>
        public static readonly CultureInfo French = CultureInfo.GetCultureInfo("fr-FR");

        /// <summary>
        /// The number as a garage writes it on paper: invoice 3 reads 000003. Six positions match
        /// the numbering the workshop already uses by hand. A number that outgrows six digits is
        /// printed whole rather than truncated.
        /// </summary>
        public static string InvoiceNumber(int number) =>
            number.ToString("000000", CultureInfo.InvariantCulture);

        /// <summary>A date a French reader says out loud: 28 août 2025.</summary>
        public static string LongDate(DateTime value) => value.ToString("d MMMM yyyy", French);

        /// <summary>An amount with its currency: 1 250,00 MAD.</summary>
        public static string Money(decimal value) => value.ToString("N2", French) + " MAD";

        /// <summary>An amount without its currency, for a column that names it once in its header.</summary>
        public static string Amount(decimal value) => value.ToString("N2", French);

        /// <summary>A quantity or a discount, keeping its own precision.</summary>
        public static string Number(decimal? value) => value?.ToString("0.####", French) ?? string.Empty;

        /// <summary>
        /// Whether a stored vehicle line actually says something.
        /// </summary>
        /// <remarks>
        /// The domain writes these lines as "label : value" when a document is issued, and it
        /// writes the label even when the value behind it is null -- a vehicle with no recorded
        /// mileage is stored as "Kilométrage : " exactly. Those lines are not empty, so emptiness
        /// is not the test: a line that ends at its colon carries a label and nothing else, and
        /// printing it would put a bare "VIN :" on the invoice.
        /// </remarks>
        public static bool Says(string vehicleLine)
        {
            if (string.IsNullOrWhiteSpace(vehicleLine)) return false;

            var trimmed = vehicleLine.Trim();
            return !trimmed.EndsWith(":", StringComparison.Ordinal);
        }
    }
}
