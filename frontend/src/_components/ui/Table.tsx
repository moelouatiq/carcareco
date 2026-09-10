import clsx from 'clsx'

/**
 * A dense business table. It scrolls sideways inside its own panel rather than dropping columns,
 * so nothing a workshop needs disappears on a narrow screen.
 */
export function TableFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    // min-w-0 and max-w-full stop a wide table from becoming the page width: it scrolls inside its
    // own panel instead of dragging every other element off the side of a phone.
    <div className={clsx('w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-line bg-surface', className)}>
      {/* contain: paint keeps the table's overflow inside this box. Without it the document
          itself became scrollable by the width the table exceeds the panel -- measured at 248px
          on a 1440px screen -- while the fixed sidebar stayed put and the content slid under it.
          overflow-x on html or body does not fix that; containment does. */}
      <div className="w-full max-w-full overflow-x-auto [contain:paint]">{children}</div>
    </div>
  )
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={clsx('min-w-full border-collapse text-sm', className)}>{children}</table>
}

export function Th({
  children,
  className,
  align = 'left',
  scope = 'col',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  scope?: string
}) {
  return (
    <th
      scope={scope}
      className={clsx(
        'border-b border-line bg-app px-3 py-2.5 text-[11px] font-semibold tracking-wide text-muted uppercase whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={clsx(
        'border-b border-line px-3 py-2.5 align-middle text-ink',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={clsx('hover:bg-app', className)}>{children}</tr>
}
