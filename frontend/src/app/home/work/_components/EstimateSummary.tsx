'use client'

import { IOfferIssuance, IPriceSummary } from '../model'
import { Field, FieldGrid } from '@/_components/ui/Section'
import { Badge } from '@/_components/ui/Badge'
import { EmailSentBadge } from './activity/badges/IssuanceBadges'
import { useLocalDateTime } from '@/_components/LocalDateTime'
import { formatMoney } from '@/_lib/money'
import { labels } from '@/_lib/labels'

/**
 * What an issued estimate is, above its lines. The total is the one the record already carries in
 * priceSummary: nothing is added up here.
 */
export function EstimateSummary({
  issuance,
  priceSummary,
}: {
  issuance: IOfferIssuance
  priceSummary?: IPriceSummary
}) {
  const issuedOn = useLocalDateTime(issuance.issuedOn)
  const acceptedOn = useLocalDateTime(issuance.acceptedOn)

  return (
    <div className="mb-4 rounded-md border border-line bg-app px-3 py-3">
      <FieldGrid>
        <Field label={labels.work.estimateShort}>
          <span className="font-medium">{labels.work.estimateShort} n° {issuance.number}</span>
        </Field>

        <Field label={labels.common.status}>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <Badge tone="success">{labels.badges.issued}</Badge>
            {issuance.acceptedOn && <Badge tone="success">{labels.badges.accepted}</Badge>}
            <EmailSentBadge issueance={issuance}></EmailSentBadge>
          </span>
        </Field>

        <Field label={labels.work.issuedOnBy}>
          <span suppressHydrationWarning>{issuedOn}</span>
          {issuance.acceptedOn && (
            <span suppressHydrationWarning className="mt-0.5 block text-[13px] text-muted">
              {labels.badges.accepted} {acceptedOn}
            </span>
          )}
        </Field>

        {priceSummary && (
          <Field label={labels.common.total}>
            <span className="font-medium">{formatMoney(priceSummary.totalWithVat)}</span>
          </Field>
        )}
      </FieldGrid>
    </div>
  )
}
