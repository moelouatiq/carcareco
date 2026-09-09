using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Http.Api.Models;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NHibernate;

namespace Carmasters.Http.Api.Controllers
{
    [TenantRateLimit]
    [Authorize(Policy = "ServerSidePolicy")]
    [Route("api/[controller]")]
    [ApiController]
    public class ServiceHistoryController : ControllerBase
    {
        private const int DefaultLimit = 10;
        private const int MaximumLimit = 50;
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
        private readonly ISession session;

        public ServiceHistoryController(ISession session)
        {
            this.session = session;
        }

        [HttpGet("clients/{clientId}")]
        public Task<ActionResult<ServiceHistoryPageDto>> ClientHistory(
            Guid clientId,
            int offset = 0,
            int limit = DefaultLimit) =>
            GetHistory(clientId, HistoryScope.Client, offset, limit);

        [HttpGet("vehicles/{vehicleId}")]
        public Task<ActionResult<ServiceHistoryPageDto>> VehicleHistory(
            Guid vehicleId,
            int offset = 0,
            int limit = DefaultLimit) =>
            GetHistory(vehicleId, HistoryScope.Vehicle, offset, limit);

        private async Task<ActionResult<ServiceHistoryPageDto>> GetHistory(
            Guid resourceId,
            HistoryScope scope,
            int offset,
            int limit)
        {
            if (offset < 0 || limit < 1 || limit > MaximumLimit)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid pagination",
                    Detail = $"Offset must be zero or greater and limit must be between 1 and {MaximumLimit}."
                });
            }

            var resourceTable = scope == HistoryScope.Client ? "domain.client" : "domain.vehicle";
            var resourceColumn = scope == HistoryScope.Client ? "clientid" : "vehicleid";
            var sql = HistorySql(resourceTable, resourceColumn);

            using var results = await session.Connection.QueryMultipleAsync(
                sql,
                new { resourceId, offset, limit });

            var summary = await results.ReadSingleAsync<HistorySummaryRow>();
            if (!summary.ResourceExists)
            {
                return NotFound();
            }

            var rows = (await results.ReadAsync<HistoryItemRow>()).ToArray();
            var items = rows.Select(row => new ServiceHistoryItemDto(
                row.WorkId,
                row.WorkNumber,
                row.OpenedOn,
                row.ClosedOn,
                row.Status,
                row.ClientId,
                row.ClientName,
                row.VehicleId,
                row.Registration,
                row.VehicleMake,
                row.VehicleModel,
                row.Odometer,
                row.Summary,
                DeserializeLines(row.LaborJson),
                DeserializeLines(row.PartsJson),
                row.TotalAmount,
                row.Currency,
                row.InvoiceNumber,
                row.InvoiceId,
                row.HasInvoice)).ToArray();

            return Ok(new ServiceHistoryPageDto(
                summary.TotalCount,
                summary.TotalInvoiced,
                summary.LastServiceDate,
                summary.LastRecordedOdometer,
                offset,
                limit,
                (long)offset + items.Length < summary.TotalCount,
                items));
        }

        private static IReadOnlyList<ServiceHistoryLineDto> DeserializeLines(string json) =>
            JsonSerializer.Deserialize<ServiceHistoryLineDto[]>(json, JsonOptions)
            ?? Array.Empty<ServiceHistoryLineDto>();

        private static string HistorySql(string resourceTable, string resourceColumn) => $@"
select
    exists(select 1 from {resourceTable} where id = @resourceId) as resourceexists,
    (select count(*)::int from domain.work where {resourceColumn} = @resourceId) as totalcount,
    (select coalesce(sum(invoice_totals.totalamount), 0)::numeric
       from domain.work w
       left join (
           select pricingid, coalesce(sum(totalwithvat), 0)::numeric as totalamount
             from domain.pricingline
            group by pricingid
       ) invoice_totals on invoice_totals.pricingid = w.invoiceid
      where w.{resourceColumn} = @resourceId) as totalinvoiced,
    (select max(startedon) from domain.work where {resourceColumn} = @resourceId) as lastservicedate,
    (select odo
       from domain.work
      where {resourceColumn} = @resourceId and odo is not null
      order by startedon desc, number desc
      limit 1) as lastrecordedodometer;

with selected_work as (
    select w.*
      from domain.work w
     where w.{resourceColumn} = @resourceId
     order by w.startedon desc, w.number desc
     limit @limit offset @offset
),
repair_items as (
    select rj.workid,
           s.id,
           coalesce(pi.code, '') as code,
           s.name,
           s.quantity::numeric as quantity,
           s.unit,
           s.price::numeric as unitprice,
           s.discount,
           (nullif(btrim(pi.code), '') is null) as islabor,
           rj.ordernr as joborder,
           pi.jnr as lineorder
      from selected_work w
      join domain.repairjob rj on rj.workid = w.id
      join domain.productinstalled pi on pi.repairjobid = rj.id
      join domain.saleable s on s.id = pi.id
    union all
    select rj.workid,
           s.id,
           '' as code,
           s.name,
           s.quantity::numeric as quantity,
           s.unit,
           s.price::numeric as unitprice,
           s.discount,
           true as islabor,
           rj.ordernr as joborder,
           0::smallint as lineorder
      from selected_work w
      join domain.repairjob rj on rj.workid = w.id
      join domain.serviceperformed sp on sp.repairjobid = rj.id
      join domain.saleable s on s.id = sp.id
),
item_summary as (
    select workid,
           (coalesce(
               json_agg(json_build_object(
                   'id', id,
                   'code', code,
                   'name', name,
                   'quantity', quantity,
                   'unit', unit,
                   'unitPrice', unitprice,
                   'discount', discount
               ) order by joborder, lineorder, name) filter (where islabor),
               '[]'::json
           ))::text as laborjson,
           (coalesce(
               json_agg(json_build_object(
                   'id', id,
                   'code', code,
                   'name', name,
                   'quantity', quantity,
                   'unit', unit,
                   'unitPrice', unitprice,
                   'discount', discount
               ) order by joborder, lineorder, name) filter (where not islabor),
               '[]'::json
           ))::text as partsjson
      from repair_items
     group by workid
),
job_notes as (
    select rj.workid,
           string_agg(nullif(btrim(rj.notes), ''), ' · ' order by rj.ordernr) as notes
      from selected_work w
      join domain.repairjob rj on rj.workid = w.id
     group by rj.workid
),
invoice_totals as (
    select pricingid, coalesce(sum(totalwithvat), 0)::numeric as totalamount
      from domain.pricingline
     group by pricingid
)
select w.id as workid,
       w.number as worknumber,
       w.startedon as openedon,
       w.completedon as closedon,
       case when w.invoiceid is not null then 'completed' else lower(w.userstatus) end as status,
       w.clientid,
       concat_ws(' ', pc.firstname, pc.lastname, lc.name) as clientname,
       w.vehicleid,
       v.regnr as registration,
       v.producer as vehiclemake,
       v.model as vehiclemodel,
       w.odo as odometer,
       coalesce(nullif(btrim(w.notes), ''), job_notes.notes, '') as summary,
       coalesce(item_summary.laborjson, '[]') as laborjson,
       coalesce(item_summary.partsjson, '[]') as partsjson,
       case when w.invoiceid is not null then coalesce(invoice_totals.totalamount, 0)::numeric end as totalamount,
       'MAD' as currency,
       i.number as invoicenumber,
       i.id as invoiceid,
       (w.invoiceid is not null) as hasinvoice
  from selected_work w
  left join domain.privateclient pc on pc.id = w.clientid
  left join domain.legalclient lc on lc.id = w.clientid
  left join domain.vehicle v on v.id = w.vehicleid
  left join domain.invoice i on i.id = w.invoiceid
  left join invoice_totals on invoice_totals.pricingid = w.invoiceid
  left join item_summary on item_summary.workid = w.id
  left join job_notes on job_notes.workid = w.id
 order by w.startedon desc, w.number desc;";

        private enum HistoryScope
        {
            Client,
            Vehicle
        }

        private sealed class HistorySummaryRow
        {
            public bool ResourceExists { get; init; }
            public int TotalCount { get; init; }
            public decimal TotalInvoiced { get; init; }
            public DateTime? LastServiceDate { get; init; }
            public int? LastRecordedOdometer { get; init; }
        }

        private sealed class HistoryItemRow
        {
            public Guid WorkId { get; init; }
            public int WorkNumber { get; init; }
            public DateTime OpenedOn { get; init; }
            public DateTime? ClosedOn { get; init; }
            public string Status { get; init; }
            public Guid? ClientId { get; init; }
            public string ClientName { get; init; }
            public Guid? VehicleId { get; init; }
            public string Registration { get; init; }
            public string VehicleMake { get; init; }
            public string VehicleModel { get; init; }
            public int? Odometer { get; init; }
            public string Summary { get; init; }
            public string LaborJson { get; init; }
            public string PartsJson { get; init; }
            public decimal? TotalAmount { get; init; }
            public string Currency { get; init; }
            public int? InvoiceNumber { get; init; }
            public Guid? InvoiceId { get; init; }
            public bool HasInvoice { get; init; }
        }
    }
}
