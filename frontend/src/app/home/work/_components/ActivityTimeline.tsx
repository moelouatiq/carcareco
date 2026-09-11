'use client'

import React from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { IActivities, IActivity, IOfferIssuance, IWorkData } from '../model'
import { Section } from '@/_components/ui/Section'
import HamburgerMenu from '@/_components/HamburgerMenu'
import ConfirmDialog, { ConfirmDialogHandle } from '@/_components/ConfirmDialog'
import { IButtonOption } from '@/_components/ButtonGroup'
import { deleteAnActivity } from '../actions/deleteAnActivity'
import { getActivityDisplayName } from './activity/getActivityDisplayName'
import { IssuanceBadges } from './activity/badges/IssuanceBadges'
import LocalDateTime from '@/_components/LocalDateTime'
import { labels } from '@/_lib/labels'

function TimelineItem({
  workId,
  activity,
  issuance,
  isSelected,
  canEdit,
  isLast,
}: {
  workId: string
  activity: IActivity
  issuance?: IOfferIssuance
  isSelected: boolean
  canEdit: boolean
  isLast: boolean
}) {
  const confirmRemoveActivityRef = React.useRef<ConfirmDialogHandle>(null)
  const name = getActivityDisplayName(activity.name, activity.number, issuance?.number)
  const href = `/home/work/${workId}/${activity.id}`
  const options = canEdit
    ? ([
        { name: labels.actions.edit, href: `${href}/edit` },
        {
          name: labels.actions.delete,
          redText: true,
          onClick: () => confirmRemoveActivityRef.current?.open({
            title: name,
            description: labels.work.deleteActivityConfirm,
            confirmObj: activity,
          }),
        },
      ] as IButtonOption[])
    : []

  return (
    <li className="relative flex gap-x-3">
      {/* The rail is drawn between the markers rather than behind them, so the last entry closes
          the timeline instead of trailing off. */}
      <div className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className={clsx('mt-2 size-2 shrink-0 rounded-full', isSelected ? 'bg-accent-ink' : 'bg-line-strong')}
        />
        {!isLast && <span aria-hidden="true" className="w-px flex-1 bg-line" />}
      </div>

      <div className={clsx('min-w-0 flex-1 rounded-md px-2 pb-4', isSelected && '-mt-0.5 bg-accent-soft pt-1 pb-3')}>
        <div className="flex items-start justify-between gap-x-2">
          <div className="min-w-0">
            <Link
              href={href}
              aria-current={isSelected ? 'page' : undefined}
              className={clsx('text-sm hover:underline', isSelected ? 'font-semibold text-ink' : 'text-ink')}
            >
              {name}
            </Link>
            <p className="mt-0.5 text-[13px] text-muted">
              <LocalDateTime value={activity.startedOn} />
              {activity.startedBy && <> · {activity.startedBy}</>}
            </p>
            {issuance && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5">
                <IssuanceBadges issueance={issuance} />
              </p>
            )}
          </div>
          {canEdit && <HamburgerMenu options={options} />}
        </div>
      </div>

      <ConfirmDialog
        ref={confirmRemoveActivityRef}
        onConfirm={async (item: IActivity) => { await deleteAnActivity(workId, item.number, item.name) }}
      />
    </li>
  )
}

/**
 * The activities of an intervention as a compact vertical timeline. Navigation stays on the URL
 * -- every entry is a Link to /home/work/{work}/{activity} -- so the selected activity survives a
 * reload and a shared link, exactly as before. It replaces a fixed 432px panel that only appeared
 * above 1536px and a bare select on everything narrower.
 */
export function ActivityTimeline({
  work,
  activities,
  issueances,
}: {
  work: IWorkData
  activities: IActivities
  issueances: IOfferIssuance[]
}) {
  const items = activities.items ?? []

  // One activity needs no navigation: its name and date already head the content section.
  if (items.length < 2) return null

  return (
    <Section title={labels.work.timeline} bodyClassName="px-3 py-3">
      <ul role="list" className="flex flex-col">
        {items.map((item, index) => (
          <TimelineItem
            key={item.id}
            workId={work.id}
            activity={item}
            issuance={issueances.find(issuance => issuance.id === item.id)}
            isSelected={item.id === activities.current.id}
            canEdit={!work.issuance}
            isLast={index === items.length - 1}
          />
        ))}
      </ul>
    </Section>
  )
}
