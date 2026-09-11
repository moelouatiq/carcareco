import clsx from "clsx";
import Link from "next/link";
import { formatMoney } from "@/_lib/money";
import InvoiceActions from "./InvoiceActions";
import { serviceHistoryLabels as labels } from "./labels";
import {
  IServiceHistoryItem,
  IServiceHistoryLine,
  IServiceHistoryPage,
  ServiceHistoryScope,
} from "./model";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export default function ServiceHistory({
  scope,
  history,
  error = false,
  basePath,
}: {
  scope: ServiceHistoryScope;
  history: IServiceHistoryPage | null;
  error?: boolean;
  basePath: string;
}) {
  const title = scope === "client" ? labels.clientTitle : labels.vehicleTitle;
  const emptyMessage = scope === "client" ? labels.clientEmpty : labels.vehicleEmpty;

  return (
    <section aria-labelledby={`${scope}-service-history-title`} className="border-t border-gray-200 px-1 py-8 sm:px-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={`${scope}-service-history-title`} className="text-base font-semibold text-gray-900">
            {title}
          </h2>
          {history ? <HistorySummary scope={scope} history={history} /> : null}
        </div>
      </div>

      {error ? <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{labels.error}</p> : null}
      {!error && history?.items.length === 0 ? (
        <p className="rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">{emptyMessage}</p>
      ) : null}
      {!error && history && history.items.length > 0 ? (
        <>
          <DesktopHistory scope={scope} items={history.items} />
          <MobileHistory scope={scope} items={history.items} />
          <HistoryPagination history={history} basePath={basePath} />
        </>
      ) : null}
    </section>
  );
}

function HistorySummary({ scope, history }: { scope: ServiceHistoryScope; history: IServiceHistoryPage }) {
  const summary = [
    { label: labels.interventionCount, value: history.totalCount.toString() },
    { label: labels.invoicedTotal, value: formatMoney(history.totalInvoiced) },
    ...(scope === "vehicle" ? [
      { label: labels.lastService, value: formatDate(history.lastServiceDate) },
      { label: labels.lastOdometer, value: formatOdometer(history.lastRecordedOdometer) },
    ] : []),
  ];

  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:flex sm:flex-wrap">
      {summary.map((item) => (
        <div key={item.label}>
          <dt className="text-gray-500">{item.label}</dt>
          <dd className="font-semibold text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DesktopHistory({ scope, items }: { scope: ServiceHistoryScope; items: IServiceHistoryItem[] }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full divide-y divide-gray-300 text-sm">
        <thead>
          <tr className="text-left text-gray-700">
            <th className="py-3 pr-4 font-semibold">{labels.date}</th>
            <th className="px-3 py-3 font-semibold">{labels.work}</th>
            <th className="px-3 py-3 font-semibold">{scope === "client" ? labels.vehicle : labels.odometer}</th>
            <th className="px-3 py-3 font-semibold">{labels.status}</th>
            <th className="px-3 py-3 font-semibold">{labels.summary}</th>
            {scope === "vehicle" ? <th className="px-3 py-3 font-semibold">{labels.parts}</th> : null}
            <th className="px-3 py-3 font-semibold">{labels.amount}</th>
            <th className="px-3 py-3 font-semibold">{labels.invoice}</th>
            <th className="py-3 pl-3 font-semibold">{labels.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.workId} className="align-top">
              <td className="py-4 pr-4 whitespace-nowrap text-gray-600"><HistoryDates item={item} /></td>
              <td className="px-3 py-4 font-medium whitespace-nowrap text-gray-900">#{item.workNumber}</td>
              <td className="px-3 py-4 text-gray-600">
                {scope === "client" ? vehicleName(item) : formatOdometer(item.odometer)}
              </td>
              <td className="px-3 py-4"><Status status={item.status} /></td>
              <td className="max-w-64 px-3 py-4 text-gray-600">{workSummary(item)}</td>
              {scope === "vehicle" ? <td className="max-w-52 px-3 py-4 text-gray-600">{lineSummary(item.parts)}</td> : null}
              <td className="px-3 py-4 whitespace-nowrap text-gray-600">
                {item.hasInvoice && item.totalAmount !== null ? formatMoney(item.totalAmount) : "—"}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-gray-600">{invoiceLabel(item)}</td>
              <td className="py-4 pl-3"><HistoryActions item={item} compact /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileHistory({ scope, items }: { scope: ServiceHistoryScope; items: IServiceHistoryItem[] }) {
  return (
    <div className="space-y-4 md:hidden">
      {items.map((item) => (
        <article key={item.workId} className="rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">#{item.workNumber}</p>
              <p className="text-sm text-gray-500">{formatDate(item.openedOn)}</p>
            </div>
            <Status status={item.status} />
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <HistoryDetail label={labels.openedOn} value={formatDate(item.openedOn)} />
            {item.closedOn ? <HistoryDetail label={labels.closedOn} value={formatDate(item.closedOn)} /> : null}
            <HistoryDetail label={scope === "client" ? labels.vehicle : labels.odometer} value={scope === "client" ? vehicleName(item) : formatOdometer(item.odometer)} />
            {scope === "vehicle" ? <HistoryDetail label={labels.client} value={item.clientName || "—"} /> : null}
            <HistoryDetail label={labels.summary} value={workSummary(item)} />
            {scope === "vehicle" ? <HistoryDetail label={labels.parts} value={lineSummary(item.parts)} /> : null}
            <HistoryDetail label={labels.amount} value={item.hasInvoice && item.totalAmount !== null ? formatMoney(item.totalAmount) : "—"} />
            <HistoryDetail label={labels.invoice} value={invoiceLabel(item)} />
          </dl>
          <div className="mt-4"><HistoryActions item={item} /></div>
        </article>
      ))}
    </div>
  );
}

function HistoryDates({ item }: { item: IServiceHistoryItem }) {
  return (
    <span className="flex flex-col gap-1">
      <span>{labels.openedOn} : {formatDate(item.openedOn)}</span>
      {item.closedOn ? <span>{labels.closedOn} : {formatDate(item.closedOn)}</span> : null}
    </span>
  );
}

function HistoryDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value}</dd>
    </div>
  );
}

function HistoryActions({ item, compact = false }: { item: IServiceHistoryItem; compact?: boolean }) {
  const workClass = compact
    ? "text-sm font-medium text-accent-ink hover:text-accent-ink"
    : "inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-accent-ink ring-1 ring-inset ring-accent hover:bg-accent-soft";

  return (
    <div className={clsx("flex flex-wrap", compact ? "flex-col gap-2" : "gap-2")}>
      <Link href={`/home/work/${item.workId}`} className={workClass}>{labels.viewWork}</Link>
      {item.hasInvoice ? <InvoiceActions workId={item.workId} compact={compact} /> : null}
    </div>
  );
}

function HistoryPagination({ history, basePath }: { history: IServiceHistoryPage; basePath: string }) {
  const previousOffset = Math.max(0, history.offset - history.limit);
  const nextOffset = history.offset + history.limit;

  return (
    <nav aria-label="Pagination de l’historique" className="mt-6 flex items-center justify-end gap-3">
      <Link
        href={`${basePath}?historyOffset=${previousOffset}`}
        prefetch={false}
        aria-disabled={history.offset === 0}
        className={clsx("rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300", history.offset === 0 ? "pointer-events-none text-gray-400" : "text-gray-700 hover:bg-gray-50")}
      >
        {labels.previous}
      </Link>
      <Link
        href={`${basePath}?historyOffset=${nextOffset}`}
        prefetch={false}
        aria-disabled={!history.hasMore}
        className={clsx("rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300", history.hasMore ? "text-gray-700 hover:bg-gray-50" : "pointer-events-none text-gray-400")}
      >
        {labels.next}
      </Link>
    </nav>
  );
}

function Status({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      {labels.statuses[status] ?? status}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function formatOdometer(value: number | null) {
  return value === null ? "—" : `${new Intl.NumberFormat("fr-FR").format(value)} km`;
}

function vehicleName(item: IServiceHistoryItem) {
  const name = [item.vehicleMake, item.vehicleModel].filter(Boolean).join(" ");
  return [name, item.registration].filter(Boolean).join(" · ") || "—";
}

function lineSummary(lines: IServiceHistoryLine[]) {
  return lines.map((line) => line.name).filter(Boolean).join(", ") || "—";
}

function workSummary(item: IServiceHistoryItem) {
  const values = [item.summary, ...item.labor.map((line) => line.name)]
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
  return values.join(" · ") || "—";
}

function invoiceLabel(item: IServiceHistoryItem) {
  return item.hasInvoice && item.invoiceNumber !== null
    ? `Facture n° ${item.invoiceNumber}`
    : labels.notInvoiced;
}
