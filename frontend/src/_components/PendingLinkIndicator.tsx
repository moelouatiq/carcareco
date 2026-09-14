'use client'

import clsx from 'clsx'
import { useLinkStatus } from 'next/link'
import Spinner from './Spinner'

/**
 * Shows that the link the person just clicked is working on it.
 *
 * React keeps the current page on screen during a router transition rather than replacing it with
 * a Suspense fallback, which is why loading.tsx never appears on a click. useLinkStatus is the
 * primitive for that case: rendered inside a Link, it reports whether that particular link's
 * navigation is in flight, so the feedback lands on the element the person actually pressed
 * instead of over the whole screen.
 *
 * Both shapes keep their space reserved whether or not they are spinning, so nothing beside them
 * moves when the state changes. The spinner is decorative: the link's own text is still there and
 * still its accessible name, and a second live region would have a screen reader announce the
 * destination twice.
 *
 * Neither shape delays anything. A prefetched navigation resolves before a spinner is perceptible,
 * which is the intended outcome rather than a shortcoming.
 */

/** Matches the two icon sizes the interface already uses, so no box changes size. */
const boxes = {
  sm: 'size-4',
  md: 'size-[18px]',
} as const

/**
 * Replaces a link's icon with a spinner while it loads. Pass the icon the link normally shows,
 * and the size it occupies, so the row keeps its height either way.
 */
export function PendingLinkIcon({
  icon,
  size = 'md',
  className,
}: {
  icon: React.ReactNode
  size?: keyof typeof boxes
  className?: string
}) {
  const { pending } = useLinkStatus()

  return (
    <span className={clsx('inline-flex shrink-0 items-center justify-center', boxes[size], className)}>
      {pending ? <Spinner label="" /> : icon}
    </span>
  )
}

/**
 * Trails a spinner after a link that has no icon of its own, such as a table's Modifier.
 *
 * The box is there whether or not it spins, so a row's width never changes and the table does not
 * reflow in the middle of a click.
 */
export function PendingLinkTrail() {
  const { pending } = useLinkStatus()

  return (
    <span className="ml-1.5 inline-flex size-4 shrink-0 items-center justify-center align-[-0.125em]">
      {pending && <Spinner label="" />}
    </span>
  )
}
