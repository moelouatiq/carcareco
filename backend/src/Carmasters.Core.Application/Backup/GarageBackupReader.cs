using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using Dapper;

namespace Carmasters.Core.Application.Backup
{
    /// <summary>
    /// Reads one garage's whole business dataset in a handful of bulk queries.
    /// </summary>
    /// <remarks>
    /// The scope is not a filter in any of this SQL: it is the database the connection is already
    /// bound to. MultiTenancyConnectionDriver picks that database from the Spn claim of the
    /// authenticated principal and nothing else, so there is no tenant column to filter on and no
    /// parameter a caller could supply.
    ///
    /// public."user" is never read. It holds Password and Profile_Image, and the people in the
    /// workbook come from domain.employee instead.
    ///
    /// Time zones are resolved here rather than in the writer, next to the column they belong to,
    /// because the columns do not agree: nearly everything is timestamptz and becomes a real
    /// instant in the garage's zone, while employee.introducedat is a plain timestamp and
    /// vehicle.productiondate is a date. Converting those two would change what they mean.
    /// </remarks>
    public sealed class GarageBackupReader
    {
        /// <summary>Where the garage is, so a stored instant reads as the time on its own clock.</summary>
        private const string GarageZone = "Africa/Casablanca";

        /// <summary>A client's display name, whichever subtype it is.</summary>
        private const string ClientNameSql =
            "coalesce(lc.name, nullif(btrim(concat_ws(' ', pc.firstname, pc.lastname)), ''))";

        private readonly IDbConnection connection;

        public GarageBackupReader(IDbConnection connection)
        {
            this.connection = connection ?? throw new ArgumentNullException(nameof(connection));
        }

        public GarageBackupData Read()
        {
            var data = new GarageBackupData
            {
                GeneratedAtUtc = DateTime.UtcNow,
                Clients = Query<GarageBackupData.ClientRow>(ClientsSql),
                Vehicles = Query<GarageBackupData.VehicleRow>(VehiclesSql),
                Works = Query<GarageBackupData.WorkRow>(WorksSql),
                Activities = Query<GarageBackupData.ActivityRow>(ActivitiesSql),
                Estimates = Query<GarageBackupData.EstimateRow>(EstimatesSql),
                Invoices = Query<GarageBackupData.InvoiceRow>(InvoicesSql),
                WorkshopLines = Query<GarageBackupData.WorkshopLineRow>(WorkshopLinesSql),
                DocumentLines = Query<GarageBackupData.DocumentLineRow>(DocumentLinesSql),
                SpareParts = Query<GarageBackupData.SparePartRow>(SparePartsSql),
                Employees = Query<GarageBackupData.EmployeeRow>(EmployeesSql),
                Settings = Query<GarageBackupData.SettingRow>(SettingsSql),
            };

            data.GarageName = data.Settings
                .FirstOrDefault(x => x.Name == SettingNames.GarageName)?.Value;

            return data;
        }

        /// <summary>
        /// One reader at a time on a connection NHibernate owns: it is neither disposed nor
        /// closed here, and no two results are left open at once.
        /// </summary>
        private IReadOnlyList<T> Query<T>(string sql) => connection.Query<T>(sql).AsList();

        /// <summary>The settings whose names the rest of the code refers to.</summary>
        public static class SettingNames
        {
            public const string GarageName = "Nom";
        }

        // ---- clients -------------------------------------------------------------------------
        // Emails come back as one aggregated cell. A client with three addresses stays one row:
        // joining domain.clientemail would have turned them into three clients.
        private static readonly string ClientsSql = $@"
select c.id                                          as ClientId,
       case when lc.id is not null then 'Personne morale' else 'Particulier' end as Kind,
       {ClientNameSql}                                as Name,
       lc.regnr                                       as RegNr,
       pc.personalcode                                as PersonalCode,
       c.phone                                        as Phone,
       (select string_agg(ce.address, ', ' order by ce.address)
          from domain.clientemail ce
         where ce.clientid = c.id)                    as Emails,
       c.address                                      as Address,
       c.city                                         as City,
       c.postalcode                                   as PostalCode,
       c.region                                       as Region,
       c.country                                      as Country,
       c.description                                  as Description,
       (c.introducedat at time zone '{GarageZone}')   as IntroducedAt
  from domain.client c
  left join domain.legalclient  lc on lc.id = c.id
  left join domain.privateclient pc on pc.id = c.id
 order by Name nulls last";

        // ---- vehicles ------------------------------------------------------------------------
        // distinct on keeps the vehicle to a single row and picks its current keeper: an open
        // registration first, then the most recent one.
        private static readonly string VehiclesSql = $@"
select v.id                                            as VehicleId,
       v.regnr                                         as RegNr,
       v.producer                                      as Producer,
       v.model                                         as Model,
       v.vin                                           as Vin,
       v.odo                                           as Odo,
       v.body                                          as Body,
       v.engine                                        as Engine,
       v.transmission                                  as Transmission,
       v.drivingside                                   as DrivingSide,
       v.series                                        as Series,
       v.region                                        as Region,
       v.productiondate                                as ProductionDate,
       v.description                                   as Description,
       keeper.ownerid                                   as ClientId,
       keeper.ownername                                 as OwnerName,
       (v.introducedat at time zone '{GarageZone}')    as IntroducedAt
  from domain.vehicle v
  left join (
        select distinct on (vr.vehicleid)
               vr.vehicleid,
               vr.ownerid                              as ownerid,
               {ClientNameSql}                         as ownername
          from domain.vehicleregistration vr
          left join domain.legalclient   lc on lc.id = vr.ownerid
          left join domain.privateclient pc on pc.id = vr.ownerid
         order by vr.vehicleid, (vr.datetimeto is null) desc, vr.datetimefrom desc
  ) keeper on keeper.vehicleid = v.id
 order by v.regnr nulls last";

        // ---- works ---------------------------------------------------------------------------
        // Assigned mechanics are aggregated, so an intervention with two mechanics stays one row.
        // UserStatus is written through untouched: the displayed status is derived by the
        // application and is not this export's to reinvent.
        private static readonly string WorksSql = $@"
select w.id                                            as WorkId,
       w.number                                        as Number,
       w.clientid                                      as ClientId,
       {ClientNameSql}                                 as ClientName,
       w.vehicleid                                     as VehicleId,
       nullif(btrim(concat_ws(' ', v.producer, v.model, case when v.regnr is null or v.regnr = ''
              then null else '(' || v.regnr || ')' end)), '') as VehicleLabel,
       w.userstatus                                    as Status,
       (w.startedon   at time zone '{GarageZone}')     as StartedOn,
       (w.completedon at time zone '{GarageZone}')     as CompletedOn,
       (w.changedon   at time zone '{GarageZone}')     as ChangedOn,
       w.odo                                           as Odo,
       nullif(btrim(concat_ws(' ', se.firstname, se.lastname)), '')  as StarterName,
       nullif(btrim(concat_ws(' ', ce2.firstname, ce2.lastname)), '') as CompleterName,
       (select string_agg(nullif(btrim(concat_ws(' ', me.firstname, me.lastname)), ''), ', '
                          order by me.lastname, me.firstname)
          from domain.assignment a
          join domain.employee me on me.id = a.mechanicid
         where a.workid = w.id)                        as Mechanics,
       w.invoiceid                                     as InvoiceId,
       i.number                                        as InvoiceNumber,
       w.notes                                         as Notes
  from domain.work w
  left join domain.client        c   on c.id  = w.clientid
  left join domain.legalclient   lc  on lc.id = c.id
  left join domain.privateclient pc  on pc.id = c.id
  left join domain.vehicle       v   on v.id  = w.vehicleid
  left join domain.employee      se  on se.id = w.starterid
  left join domain.employee      ce2 on ce2.id = w.completerid
  left join domain.invoice       i   on i.id  = w.invoiceid
 order by w.number";

        // ---- activities ----------------------------------------------------------------------
        // The two kinds of activity live in separate tables with the same role on a work.
        private static readonly string ActivitiesSql = $@"
select o.id                                            as ActivityId,
       'Devis'                                         as Kind,
       o.workid                                        as WorkId,
       w.number                                        as WorkNumber,
       o.ordernr                                       as OrderNr,
       (o.startedon  at time zone '{GarageZone}')      as StartedOn,
       nullif(btrim(concat_ws(' ', se.firstname, se.lastname)), '') as StarterName,
       o.estimateid                                    as EstimateId,
       e.number                                        as EstimateNumber,
       (o.acceptedon at time zone '{GarageZone}')      as AcceptedOn,
       nullif(btrim(concat_ws(' ', ae.firstname, ae.lastname)), '') as AcceptorName,
       o.notes                                         as Notes
  from domain.offer o
  join domain.work      w  on w.id  = o.workid
  left join domain.employee se on se.id = o.starterid
  left join domain.employee ae on ae.id = o.acceptorid
  left join domain.estimate e  on e.id  = o.estimateid
union all
select r.id                                            as ActivityId,
       'Réparation'                                    as Kind,
       r.workid                                        as WorkId,
       w.number                                        as WorkNumber,
       r.ordernr                                       as OrderNr,
       (r.startedon at time zone '{GarageZone}')       as StartedOn,
       nullif(btrim(concat_ws(' ', se.firstname, se.lastname)), '') as StarterName,
       null::uuid                                      as EstimateId,
       null::varchar                                   as EstimateNumber,
       null::timestamp                                 as AcceptedOn,
       null::text                                      as AcceptorName,
       r.notes                                         as Notes
  from domain.repairjob r
  join domain.work      w  on w.id  = r.workid
  left join domain.employee se on se.id = r.starterid
 order by WorkNumber, OrderNr, Kind";

        /// <summary>The four vehicle description lines of a document, as one readable cell.</summary>
        private const string VehicleLinesSql =
            "nullif(btrim(concat_ws(' / ', p.vehicleline1, p.vehicleline2, p.vehicleline3, p.vehicleline4)), '')";

        /// <summary>
        /// Sums the document's own frozen line totals. This adds up values PricingLine already
        /// stores; it does not re-derive them from price, quantity and discount.
        /// </summary>
        private const string LineTotalsSql = @"
       (select sum(pl.total)        from domain.pricingline pl where pl.pricingid = p.id) as LinesTotal,
       (select sum(pl.totalwithvat) from domain.pricingline pl where pl.pricingid = p.id) as LinesTotalWithVat";

        // ---- estimates -----------------------------------------------------------------------
        // An estimate is a pricing: domain.estimate.id references domain.pricing.id. The work it
        // belongs to is reached through the offer that carries the estimate.
        private static readonly string EstimatesSql = $@"
select e.id                                            as EstimateId,
       e.number                                        as Number,
       o.workid                                        as WorkId,
       w.number                                        as WorkNumber,
       (p.issuedon  at time zone '{GarageZone}')       as IssuedOn,
       (p.senton    at time zone '{GarageZone}')       as SentOn,
       (p.printedon at time zone '{GarageZone}')       as PrintedOn,
       p.partyname                                     as PartyName,
       p.partyaddress                                  as PartyAddress,
       p.partycode                                     as PartyCode,
       p.email                                         as Email,
       {VehicleLinesSql}                               as VehicleLines,
       nullif(btrim(concat_ws(' ', ie.firstname, ie.lastname)), '') as IssuerName,
{LineTotalsSql}
  from domain.estimate e
  join domain.pricing  p  on p.id = e.id
  left join domain.employee ie on ie.id = p.issuerid
  left join domain.offer    o  on o.estimateid = e.id
  left join domain.work     w  on w.id = o.workid
 order by p.issuedon";

        // ---- invoices ------------------------------------------------------------------------
        // Likewise an invoice is a pricing, and the work points at it through work.invoiceid.
        private static readonly string InvoicesSql = $@"
select i.id                                            as InvoiceId,
       i.number                                        as Number,
       w.id                                            as WorkId,
       w.number                                        as WorkNumber,
       (p.issuedon  at time zone '{GarageZone}')       as IssuedOn,
       (p.senton    at time zone '{GarageZone}')       as SentOn,
       (p.printedon at time zone '{GarageZone}')       as PrintedOn,
       case i.paymenttype when 1 then 'Espèces' when 2 then 'Virement bancaire'
                          when 3 then 'Carte' else i.paymenttype::text end as PaymentType,
       i.duedays                                       as DueDays,
       i.ispaid                                        as IsPaid,
       i.iscredited                                    as IsCredited,
       p.partyname                                     as PartyName,
       p.partyaddress                                  as PartyAddress,
       p.partycode                                     as PartyCode,
       p.email                                         as Email,
       {VehicleLinesSql}                               as VehicleLines,
       nullif(btrim(concat_ws(' ', ie.firstname, ie.lastname)), '') as IssuerName,
{LineTotalsSql}
  from domain.invoice i
  join domain.pricing  p  on p.id = i.id
  left join domain.employee ie on ie.id = p.issuerid
  left join domain.work     w  on w.invoiceid = i.id
 order by i.number";

        // ---- workshop lines ------------------------------------------------------------------
        // All four line kinds sit on domain.saleable, which carries name, quantity, unit, price
        // and discount; each subtype adds what it attaches to. No total: see GarageBackupData.
        private static readonly string WorkshopLinesSql = @"
select sa.id as LineId, 'Service proposé' as Kind,
       o.workid as WorkId, w.number as WorkNumber, so.offerid as ActivityId,
       null::smallint as Jnr, null::varchar as Code,
       sa.name as Name, sa.quantity as Quantity, sa.unit as Unit, sa.price as Price,
       sa.discount as Discount, null::text as InstallStatus, null::text as MechanicName,
       null::varchar as Notes
  from domain.serviceoffered so
  join domain.saleable sa on sa.id = so.id
  join domain.offer    o  on o.id  = so.offerid
  join domain.work     w  on w.id  = o.workid
union all
select sa.id, 'Pièce proposée',
       o.workid, w.number, po.offerid,
       po.jnr, po.code,
       sa.name, sa.quantity, sa.unit, sa.price, sa.discount, null, null, null
  from domain.productoffered po
  join domain.saleable sa on sa.id = po.id
  join domain.offer    o  on o.id  = po.offerid
  join domain.work     w  on w.id  = o.workid
union all
select sa.id, 'Service réalisé',
       r.workid, w.number, sp.repairjobid,
       null, null,
       sa.name, sa.quantity, sa.unit, sa.price, sa.discount, null,
       nullif(btrim(concat_ws(' ', me.firstname, me.lastname)), ''), sp.notes
  from domain.serviceperformed sp
  join domain.saleable  sa on sa.id = sp.id
  join domain.repairjob r  on r.id  = sp.repairjobid
  join domain.work      w  on w.id  = r.workid
  left join domain.employee me on me.id = sp.mechanicid
union all
select sa.id, 'Pièce installée',
       r.workid, w.number, pi.repairjobid,
       pi.jnr, pi.code,
       sa.name, sa.quantity, sa.unit, sa.price, sa.discount,
       case pi.status when 0 then 'Non posée' when 1 then 'En commande'
                      when 2 then 'Reçue, en attente de pose' when 3 then 'Posée'
                      else pi.status::text end,
       null, pi.notes
  from domain.productinstalled pi
  join domain.saleable  sa on sa.id = pi.id
  join domain.repairjob r  on r.id  = pi.repairjobid
  join domain.work      w  on w.id  = r.workid
 order by WorkNumber, Kind, Jnr nulls last, Name";

        // ---- document lines ------------------------------------------------------------------
        // PricingLine hangs off Pricing, and both estimate and invoice share that primary key, so
        // the document a line belongs to is found by joining on pricingid. There is no invoice_id
        // column on the line itself.
        private static readonly string DocumentLinesSql = @"
select case when e.id is not null then 'Devis'
            when i.id is not null then 'Facture' end   as DocumentKind,
       coalesce(e.number, i.number::varchar)           as DocumentNumber,
       e.id                                            as EstimateId,
       i.id                                            as InvoiceId,
       pl.nr                                           as Nr,
       pl.description                                  as Description,
       pl.quantity                                     as Quantity,
       pl.unit                                         as Unit,
       pl.unitprice                                    as UnitPrice,
       pl.discount                                     as Discount,
       pl.total                                        as Total,
       pl.totalwithvat                                 as TotalWithVat
  from domain.pricingline pl
  left join domain.estimate e on e.id = pl.pricingid
  left join domain.invoice  i on i.id = pl.pricingid
 order by DocumentKind, DocumentNumber, pl.nr";

        // ---- stock ---------------------------------------------------------------------------
        private static readonly string SparePartsSql = $@"
select sp.id                                           as SparePartId,
       sp.code                                         as Code,
       sp.name                                         as Name,
       sp.price                                        as Price,
       sp.quantity                                     as Quantity,
       sp.discount                                     as Discount,
       sp.storageid                                    as StorageId,
       st.name                                         as StorageName,
       st.address                                      as StorageAddress,
       um.name                                         as ReferencePriceName,
       um.price                                        as ReferencePrice,
       sp.description                                  as Description,
       (sp.introducedat at time zone '{GarageZone}')   as IntroducedAt
  from domain.sparepart sp
  left join domain.storage           st on st.id = sp.storageid
  left join domain.unitedmotorsprice um on um.id = sp.umpriceid
 order by sp.code";

        // ---- employees -----------------------------------------------------------------------
        // Only what makes the ids elsewhere in the workbook readable. Employee also holds email,
        // phone, address and a description; those are left out deliberately.
        // introducedat is a plain timestamp here, so it keeps its own value.
        private static readonly string EmployeesSql = @"
select e.id        as EmployeeId,
       e.lastname  as LastName,
       e.firstname as FirstName,
       e.proffession as Profession,
       e.introducedat as IntroducedAt
  from domain.employee e
 order by e.lastname, e.firstname";

        // ---- settings ------------------------------------------------------------------------
        // The business settings the owner already sees in Paramètres, flattened. Nothing from
        // configuration files is involved: this reads two tables and nothing else.
        private static readonly string SettingsSql = @"
select 'Entreprise' as ""Group"", 'Nom'                  as Name, r.name         as Value from tenant_config.requisites r
union all select 'Entreprise', 'Téléphone',              r.phone                from tenant_config.requisites r
union all select 'Entreprise', 'Adresse',                r.address              from tenant_config.requisites r
union all select 'Entreprise', 'E-mail',                 r.email                from tenant_config.requisites r
union all select 'Entreprise', 'Compte bancaire',        r.bank_account         from tenant_config.requisites r
union all select 'Entreprise', 'Numéro RC',     r.reg_nr               from tenant_config.requisites r
union all select 'Entreprise', 'Identifiant fiscal',     r.tax_id               from tenant_config.requisites r
union all select 'Facturation', 'Taux de TVA',       p.vat_rate::varchar    from tenant_config.pricing p
union all select 'Facturation', 'Pénalité de retard',            p.surcharge            from tenant_config.pricing p
union all select 'Facturation', 'Mentions légales',              p.disclaimer           from tenant_config.pricing p
union all select 'Facturation', 'Ligne de signature',    case when p.signature_line then 'Oui' else 'Non' end from tenant_config.pricing p
union all select 'Facturation', 'Contenu de l''e-mail (facture)', p.invoice_email_content from tenant_config.pricing p
union all select 'Devis',       'Contenu de l''e-mail (devis)',  p.estimate_email_content from tenant_config.pricing p";
    }
}
