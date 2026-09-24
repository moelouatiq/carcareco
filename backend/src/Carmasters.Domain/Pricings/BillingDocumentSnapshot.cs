namespace Carmasters.Core.Domain
{
    /// <summary>
    /// The tenant-owned administrative and fiscal values in force when a billing document is
    /// issued. These values belong to the document after issuance; later tenant configuration
    /// changes must not rewrite its representation.
    /// </summary>
    public sealed class BillingDocumentSnapshot
    {
        public BillingDocumentSnapshot(
            string issuerName,
            string issuerAddress,
            string issuerPhone,
            string issuerEmail,
            string issuerRegNr,
            string issuerKmkr,
            string issuerBankAccount,
            int vatRate,
            string surCharge,
            string disclaimer,
            bool signatureLine)
        {
            IssuerName = issuerName;
            IssuerAddress = issuerAddress;
            IssuerPhone = issuerPhone;
            IssuerEmail = issuerEmail;
            IssuerRegNr = issuerRegNr;
            IssuerKmkr = issuerKmkr;
            IssuerBankAccount = issuerBankAccount;
            VatRate = vatRate;
            SurCharge = surCharge;
            Disclaimer = disclaimer;
            SignatureLine = signatureLine;
        }

        public string IssuerName { get; }
        public string IssuerAddress { get; }
        public string IssuerPhone { get; }
        public string IssuerEmail { get; }
        public string IssuerRegNr { get; }
        public string IssuerKmkr { get; }
        public string IssuerBankAccount { get; }
        public int VatRate { get; }
        public string SurCharge { get; }
        public string Disclaimer { get; }
        public bool SignatureLine { get; }
    }
}
