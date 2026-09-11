import clsx from 'clsx'

// Every pairing here was checked against its own background: the lowest is amber at 5.22:1, so a
// badge stays readable rather than becoming decoration.
export type BadgeTone = 'neutral' | 'amber' | 'success' | 'danger' | 'info'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-soft text-neutral-ink',
  amber: 'bg-accent-soft text-accent-ink',
  success: 'bg-success-soft text-success-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-info-soft text-info-ink',
}

export function Badge({
  children,
  tone = 'neutral',
  title,
  className,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  title?: string
  className?: string
}) {
  return (
    <span
      title={title}
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[12px] font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
