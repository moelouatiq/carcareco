export function resolveResourcePageName(
  resourceName: string,
  pageName?: string | null,
) {
  return pageName || resourceName
}

export function resourceEditPath(
  resourceName: string,
  id: string,
  pageName?: string | null,
) {
  const resolvedPageName = resolveResourcePageName(resourceName, pageName)

  return `/home/${resolvedPageName}/edit/${encodeURIComponent(id)}`
}
