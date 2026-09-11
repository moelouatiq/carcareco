'use client'

import { IWorkData } from '../model'
import { Field, FieldGrid, Section } from '@/_components/ui/Section'
import { Badge } from '@/_components/ui/Badge'
import PricingDownloadLink from './activity/PricingDownloadLink'
import { EmailSentBadge, OverdueBadge } from './activity/badges/IssuanceBadges'
import { useLocalDateTime } from '@/_components/LocalDateTime'
import { labels } from '@/_lib/labels'

/**
 * The invoicing block, shown only once an invoice exists. Nothing here is computed: the number,
 * the dates and the paid flag all come from the record, and the PDF links are the existing ones.
 */
export function InvoiceSection({ work }: { work: IWorkData }) {
  const issuance = work.issuance
  const issuedOn = useLocalDateTime(issuance?.issuedOn)

  if (!issuance) return null

  return (
    <Section
      title={labels.work.invoicing}
      actions={
        /* PricingDownloadLink already carries the print link beside the download. */
        <PricingDownloadLink
          name="Invoice"
          id={work.id}
          number={issuance.invoiceNumber}
          hideLabel={true}
        ></PricingDownloadLink>
      }
    >
      <FieldGrid>
        <Field label={labels.work.invoiceShort}>
          <span className="font-medium">{labels.work.invoiceShort} n° {issuance.invoiceNumber}</span>
        </Field>

        <Field label={labels.work.issuedOnBy}>
          <span suppressHydrationWarning>{issuedOn}</span>
          {issuance.issuedBy && <span className="mt-0.5 block text-[13px] text-muted">{issuance.issuedBy}</span>}
        </Field>

        <Field label={labels.work.payment}>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {issuance.isPaid
              ? <Badge tone="success">{labels.work.paid}</Badge>
              : <Badge tone="info">{labels.work.unpaid}</Badge>}
            <OverdueBadge issueance={issuance}></OverdueBadge>
          </span>
        </Field>

        <Field label={labels.work.dueIn}>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {issuance.dueDays} {labels.work.days}
            <EmailSentBadge issueance={issuance}></EmailSentBadge>
          </span>
        </Field>
      </FieldGrid>
    </Section>
  )
}
