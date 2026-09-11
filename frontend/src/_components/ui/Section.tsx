import clsx from 'clsx'

/**
 * A white panel on the off-white page. Thin border, no shadow: the separation comes from the
 * background contrast, which keeps a dense screen calm.
 */
export function Section({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section className={clsx('overflow-hidden rounded-lg border border-line bg-surface', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={clsx('px-4 py-4', bodyClassName)}>{children}</div>
    </section>
  )
}

/** A label/value pair, the unit most detail screens are built from. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  )
}

export function FieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={clsx('grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4', className)}>{children}</dl>
}
