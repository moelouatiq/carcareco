import { PlusIcon } from "@heroicons/react/16/solid"
import { PageHeader } from "@/_components/ui/PageHeader"
import { ButtonLink } from "@/_components/ui/Button"
import { PendingLinkIcon } from "@/_components/PendingLinkIndicator"
import { labels } from "@/_lib/labels"

// The action names what will be created rather than saying "add new", so a workshop reads
// "Nouvelle intervention" rather than a generic verb.
const createLabel: Record<string, string> = {
  work: labels.work.newWork,
  clients: labels.clients.newClient,
  vehicles: labels.vehicles.newVehicle,
  inventory: labels.inventory.newSparePart,
}

export function SearchCardHeader({
  title,
  description,
  pageName,
  children,
}: {
  title?: string | undefined,
  description?: string | undefined,
  pageName?: string,
  children?: React.ReactNode
}) {
  return (
    <PageHeader
      title={title ?? ''}
      description={description}
      actions={
        <>
          {children}
          {pageName && (
            <ButtonLink href={`/home/${pageName}/new`} tone="primary">
              <PendingLinkIcon size="sm" className="-ml-0.5" icon={<PlusIcon aria-hidden="true" className="size-4" />} />
              {createLabel[pageName] ?? labels.actions.edit}
            </ButtonLink>
          )}
        </>
      }
    />
  )
}
