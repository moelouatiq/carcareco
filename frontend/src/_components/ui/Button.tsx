import clsx from 'clsx'
import Link from 'next/link'

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

// The accent is legible as a surface, not as text, so the primary action is ink on amber rather
// than white on amber, which would sit at 2.17:1.
const tones: Record<ButtonTone, string> = {
  primary: 'bg-accent text-ink border-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-ink border-line hover:bg-neutral-soft',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-neutral-soft hover:text-ink',
  danger: 'bg-surface text-danger-ink border-line hover:bg-danger-soft',
}

const sizes: Record<ButtonSize, string> = {
  // Comfortably past the 44px touch target once the line box is counted.
  sm: 'gap-x-1.5 px-2.5 py-1.5 text-[13px]',
  md: 'gap-x-2 px-3.5 py-2 text-sm',
}

function classes(tone: ButtonTone, size: ButtonSize, className?: string) {
  return clsx(
    'inline-flex items-center justify-center rounded-md border font-medium',
    'transition-colors disabled:cursor-default disabled:opacity-50',
    tones[tone],
    sizes[size],
    className,
  )
}

export function Button({
  children,
  tone = 'secondary',
  size = 'md',
  type = 'button',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone; size?: ButtonSize }) {
  return (
    <button type={type} className={classes(tone, size, className)} {...rest}>
      {children}
    </button>
  )
}

export function ButtonLink({
  children,
  href,
  tone = 'secondary',
  size = 'md',
  prefetch,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  tone?: ButtonTone
  size?: ButtonSize
  prefetch?: boolean
}) {
  return (
    <Link href={href} prefetch={prefetch} className={classes(tone, size, className)} {...rest}>
      {children}
    </Link>
  )
}
