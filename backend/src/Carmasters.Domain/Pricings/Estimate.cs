using Carmasters.Core.Domain;
using System;
using System.Linq;

namespace Carmasters.Core.Domain
{
    public class Estimate : Pricing
    {
        protected Estimate() : base() { }
        public Estimate( string number,
                       Employee issuer = null, 
                        DateTime issuedOn = default, 
                        string partyName = null,
                        DateTime? sentOn = null,
                        DateTime? printedOn = null,
                        string email = null, 
                        string partyAddress = null,
                        string partyCode = null,
                        string vehicleLine1 = null,
                        string vehicleLine2 = null,
                        string vehicleLine3 = null,
                        string vehicleLine4 = null,
                        Guid? id = null,
                        BillingDocumentSnapshot billingDocumentSnapshot = null) : base( issuer, sentOn, printedOn, email, partyName, partyAddress, partyCode, vehicleLine1, vehicleLine2, vehicleLine3,vehicleLine4, issuedOn,id, billingDocumentSnapshot)
        {
            this.Number = number;
        }

        public  override string GetFileName()
        {
            return $"devis_{Number}.pdf";
        }
        public override string GetDisplayName()
        {
            return $"Devis n° {Number}";
        }
        public virtual string Number { get; }
        public virtual Estimate CreateFor(BillingDocumentSnapshot billingDocumentSnapshot, Offer offer, Employee issuer)
        {
            if (billingDocumentSnapshot == null) throw new ArgumentNullException(nameof(billingDocumentSnapshot));

            var newSet = offer.Products.ToArray();
            ApplyClientInformation(offer.Work.Client);
            if (offer.IsVehicleLinesOnEstimate)
            {
                ApplyVehicleInformation(offer.Work.Vehicle);
            }
            else ApplyVehicleInformation(null);
            IssuedNowBy(issuer);
            ApplyBillingDocumentSnapshot(billingDocumentSnapshot);
            SentOn = default;
            Email = default;
             PricingLine.Synchronize(newSet.Select((x, i) => ToLine(billingDocumentSnapshot.VatRate,x, Convert.ToInt16(i + 1))).ToArray(), lines);
            return this;
        }

        public override string GetNumber()
        {
            return Number.ToString();
        }
    }
}
