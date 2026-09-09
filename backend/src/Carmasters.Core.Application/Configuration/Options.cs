using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Permissions;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace Carmasters.Core.Application.Configuration
{
    public record JwtOptions(string Secret, string ConsumerSecret,TimeSpan SessionTimeout) { public JwtOptions() : this(default,default, default) { } }
    public record RequisitesOptions(string Name, string Phone, string Address, string Email, string BankAccount, string RegNr, string KMKR) { public RequisitesOptions() : this(default, default, default, default, default, default, default) { } }
    public record InvoiceOptions(int VatRate,string SurCharge, string Disclaimer, bool SignatureLine, string EmailContent) { public InvoiceOptions() : this(default,default, default, default, default) { } }
    public record EstimateOptions(string EmailContent) { public EstimateOptions() : this(default(string)) { } }
    public record PricingOptions(InvoiceOptions Invoice, EstimateOptions Estimate) { public PricingOptions() : this(default, default) { } }

    public record AppOptions(RequisitesOptions Requisites, PricingOptions Pricing) { public AppOptions() : this(default, default) { } }

    public record SmtpOptions(string Host, int Port, string User, string Password) { public SmtpOptions() : this(default, default, default, default) { } }

    public enum DbKind
    {
        Tenancy, Template
    }
    public class DbOptions
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public string UserId { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }

        /// <summary>
        /// Npgsql SSL mode, e.g. "VerifyFull". Left unset, Npgsql's own default applies and the
        /// connection string is built exactly as it was before this setting existed.
        /// </summary>
        public string SslMode { get; set; }

        /// <summary>
        /// Path to the PEM root certificate used to verify the server, required by VerifyCA and
        /// VerifyFull when the issuing authority is not already trusted by the host.
        /// </summary>
        public string RootCertificate { get; set; }

        public MultiTenancyOptions MultiTenancy { get; set; }
        public class MultiTenancyOptions
        {
            public bool Enabled { get; set; }
            public SuffixOptions Suffix { get; set; }


            public class SuffixOptions
            {
                public string Tenancy { get; set; }
                public string Template { get; set; }
            }
        }

    }
}
