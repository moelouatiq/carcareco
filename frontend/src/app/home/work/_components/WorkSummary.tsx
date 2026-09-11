import { IWorkData } from '../model'
import { Field, FieldGrid, Section } from '@/_components/ui/Section'
import LocalDateTime from '@/_components/LocalDateTime'
import { labels } from '@/_lib/labels'

/**
 * Who and what the intervention is about, read in one pass. The fields are the ones the record
 * already carries: nothing is derived here and nothing is fetched.
 */
export function WorkSummary({ work }: { work: IWorkData }) {
  const vehicle = [work.vehicleProducer, work.vehicleModel].filter(Boolean).join(' ')
  const vehicleDetail = [
    work.vehicleRegNr,
    work.vehicleVin,
    work.odo === null || work.odo === undefined ? null : `${work.odo} km`,
  ].filter(Boolean).join(' · ')
  const client = work.clientName
  const clientDetail = [work.clientPhone, work.clientEmail].filter(Boolean).join(' · ')
  const mechanics = work.mechanics?.map(item => item.name).join(', ')

  return (
    <Section title={labels.work.identity}>
      <FieldGrid>
        <Field label={labels.work.client}>
          {client ? (
            <>
              <span className="font-medium">{client}</span>
              {clientDetail && <span className="mt-0.5 block text-[13px] text-muted">{clientDetail}</span>}
            </>
          ) : (
            <span className="text-muted">{labels.common.notProvided}</span>
          )}
        </Field>

        <Field label={labels.work.vehicle}>
          {vehicle || vehicleDetail ? (
            <>
              <span className="font-medium">{vehicle || labels.common.noValue}</span>
              {vehicleDetail && <span className="mt-0.5 block text-[13px] text-muted">{vehicleDetail}</span>}
            </>
          ) : (
            <span className="text-muted">{labels.common.notProvided}</span>
          )}
        </Field>

        <Field label={labels.work.openedOn}>
          <LocalDateTime value={work.startedOn} />
          {work.completedOn && (
            <span className="mt-0.5 block text-[13px] text-muted">
              {labels.work.completedOn} <LocalDateTime value={work.completedOn} />
            </span>
          )}
        </Field>

        <Field label={labels.work.mechanics}>
          {mechanics ? mechanics : <span className="text-muted">{labels.common.notProvided}</span>}
        </Field>
      </FieldGrid>

      {work.notes && (
        <div className="mt-4 border-t border-line pt-4">
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">{labels.common.notes}</p>
          <p className="mt-0.5 text-sm whitespace-pre-line text-ink">{work.notes}</p>
        </div>
      )}
    </Section>
  )
}
