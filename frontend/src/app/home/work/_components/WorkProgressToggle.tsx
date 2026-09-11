'use client'

import { Field, Label } from '@headlessui/react'
import FormSwitch from '@/_components/FormSwitch'
import { changeWorkStatus } from '../actions/changeWorkStatus'
import { IWorkData } from '../model'
import { labels } from '@/_lib/labels'

/**
 * The in-progress flag, kept exactly as it was: offered only while the intervention is open and
 * not yet invoiced, and writing the same two statuses.
 */
export function WorkProgressToggle({ work }: { work: IWorkData }) {
  if (work.issuance || work.status === 'closed') return null

  return (
    <Field className="flex items-center gap-x-2">
      <FormSwitch
        name="inprogress"
        ariaLabel={labels.work.isInProgress}
        defaultChecked={work.status === 'inprogress'}
        onChange={async value => {
          await changeWorkStatus(work.id, value ? 'InProgress' : 'Default')
        }}
      ></FormSwitch>
      <Label as="span" className="text-[13px] text-muted">{labels.work.isInProgress}</Label>
    </Field>
  )
}
