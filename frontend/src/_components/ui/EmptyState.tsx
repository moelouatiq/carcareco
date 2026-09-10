export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
