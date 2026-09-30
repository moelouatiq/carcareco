
using Carmasters.Core.Domain;
using System;
using System.Linq;

namespace Carmasters.Core.Domain
{
    public class Invoice : Pricing
    {
        protected Invoice() : base() { }
        public Invoice(int number,Employee issuer,DateTime issuedOn, PaymentType paymentType, short dueDays, string partyName, bool isPaid = false, bool isCredited = false, DateTime? sentOn = null, DateTime? printedOn = null, string email = null, string partyAddress = null, string partyCode = null, string vehicleLine1 = null, string vehicleLine2 = null, string vehicleLine3 = null, string vehicleLine4 = null, Guid? id = null, BillingDocumentSnapshot billingDocumentSnapshot = null) : base(    issuer,sentOn, printedOn, email, partyName, partyAddress, partyCode, vehicleLine1, vehicleLine2, vehicleLine3,vehicleLine4, issuedOn,id, billingDocumentSnapshot)
        {
            this.Number = number;
            this.PaymentType = paymentType;
            DueDays = dueDays;
            IsPaid = isPaid;
            IsCredited = isCredited; 
        }

        public virtual int Number { get; protected internal set; }
        public virtual PaymentType PaymentType { get; }
        public  virtual short DueDays { get; }
        public  virtual bool IsPaid { get; protected internal set; }
        public  virtual bool IsCredited { get; }

        public virtual bool IsOverDue => !IsPaid && this.IssuedOn.AddDays(DueDays) <= DateTime.Now;
        public override string GetFileName()
        {
            return $"facture_{Number}.pdf";
        }
        public override string GetDisplayName()
        {
            return $"Facture n° {Number}";
        }
        public virtual void MarkPaid(bool paid) => IsPaid = paid;
        public virtual string PaymentStatus 
        {
            get
            {
                if (IsPaid) return "Paid";
                if (IsOverDue) return $"Payment overdue {(DateTime.Today - this.IssuedOn.AddDays(DueDays).Date).Days} days";
                return $"Duedate in {(this.IssuedOn.AddDays(DueDays).Date - DateTime.Today).Days} days";
            }
        }

        /// <summary>
        /// Issues the invoice for a finished job, taking its snapshot of client, vehicle and
        /// tenant billing configuration.
        /// </summary>
        /// <remarks>
        /// The vehicle is captured here, at issue time, and never read again: a car that is later
        /// resprayed, re-registered or driven another ten thousand kilometres must not change an
        /// invoice that was already sent. Passing null when the garage chose not to show it is
        /// what leaves the lines empty, and null is also what a job with no vehicle gives.
        /// </remarks>
        internal static Invoice CreateFor(Work work, ISequencedNumberProvider numberProvider, BillingDocumentSnapshot billingDocumentSnapshot, PaymentType paymentType, short dueDays, Employee issuer, bool showVehicleOnInvoice)
        {
            if (billingDocumentSnapshot == null) throw new ArgumentNullException(nameof(billingDocumentSnapshot));

            var invoice = new Invoice(numberProvider.Next(), issuer, DateTime.Now, paymentType, dueDays, null,
                billingDocumentSnapshot: billingDocumentSnapshot);
            
            invoice.ApplyClientInformation(work.Client);
            invoice.ApplyVehicleInformation(showVehicleOnInvoice ? work.Vehicle : null);

            int counter = 1;
            foreach (var line in work.Jobs.SelectMany((j,i)=>j.Products.Select((p) => invoice.ToLine(billingDocumentSnapshot.VatRate,p, Convert.ToInt16(counter)))))
            {
                invoice.lines.Add(line);
                counter++;
            }
            return invoice;
        }

        public override string GetNumber()
        {
            return Number.ToString();
        }
    }
}
