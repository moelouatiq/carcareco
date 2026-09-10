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
    ? "text-sm font-medium text-accent-ink hover:text-accent-ink"
    : "inline-flex min-h-10 items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-accent-ink ring-1 ring-inset ring-accent hover:bg-accent-soft";

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
