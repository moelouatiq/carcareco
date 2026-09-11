import clsx from 'clsx'
import Link from 'next/link'

export interface TabItem {
  label: string
  href: string
  current: boolean
}

/** Underlined tabs, used where a record has a couple of distinct views. */
export function Tabs({ items, ariaLabel }: { items: TabItem[]; ariaLabel: string }) {
  return (
    <nav aria-label={ariaLabel} className="-mb-px flex gap-x-6 overflow-x-auto border-b border-line">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.current ? 'page' : undefined}
          className={clsx(
            'shrink-0 border-b-2 px-0.5 py-2.5 text-sm font-medium whitespace-nowrap',
            item.current
              ? 'border-accent text-ink'
              : 'border-transparent text-muted hover:border-line-strong hover:text-ink',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
