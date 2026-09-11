import clsx from 'clsx'
import { MagnifyingGlassIcon } from '@heroicons/react/16/solid'

export const controlClasses =
  'block w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink ' +
  'placeholder:text-muted focus:border-accent focus:outline-none disabled:bg-app disabled:text-muted'

export function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
      {children}
    </label>
  )
}

export function Input({
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(controlClasses, className)} {...rest} />
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(controlClasses, 'pr-8', className)} {...rest}>
      {children}
    </select>
  )
}

/** A search field with the icon inside, used on every list screen. */
export function SearchInput({
  className,
  'aria-label': ariaLabel,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={clsx('relative', className)}>
      <MagnifyingGlassIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted"
      />
      <input aria-label={ariaLabel} className={clsx(controlClasses, 'pl-8')} {...rest} />
    </div>
  )
}

/** The compact bar of filters that sits above a list, instead of a full form card. */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex flex-wrap items-end gap-2', className)}>{children}</div>
  )
}
