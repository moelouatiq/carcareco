import Link from "next/link";
import { serviceHistoryLabels as labels } from "./labels";

export default function InvoiceActions({
  workId,
  compact = false,
}: {
  workId: string;
  compact?: boolean;
}) {
  const invoiceUrl = `/api/backend/pricings/invoice/${encodeURIComponent(workId)}/pdf`;
  const linkClass = compact
    ? "text-sm font-medium text-indigo-700 hover:text-indigo-500"
    : "inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50";

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={invoiceUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {labels.viewInvoice}
      </Link>
      <a href={`${invoiceUrl}/download`} download className={linkClass}>
        {labels.downloadInvoice}
      </a>
    </div>
  );
}
