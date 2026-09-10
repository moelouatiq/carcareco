import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/16/solid'

export interface Crumb {
  label: string
  href?: string
}

/** Where the page sits, shown above its title rather than as a separate bar. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-1">
      <ol className="flex flex-wrap items-center gap-x-1 text-[13px] text-muted">
        {items.map((item, index) => (
          <li key={item.label + index} className="flex items-center gap-x-1">
            {index > 0 && <ChevronRightIcon aria-hidden="true" className="size-3.5 text-line-strong" />}
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="hover:text-ink">{item.label}</Link>
            ) : (
              <span aria-current={index === items.length - 1 ? 'page' : undefined} className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  meta,
}: {
  title: string
  description?: string
  breadcrumb?: Crumb[]
  actions?: React.ReactNode
  meta?: React.ReactNode
}) {
  return (
    <header className="mb-5">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
            {meta}
          </div>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
