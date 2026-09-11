import { PlusIcon } from "@heroicons/react/16/solid"
import { PageHeader } from "@/_components/ui/PageHeader"
import { ButtonLink } from "@/_components/ui/Button"
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
              <PlusIcon aria-hidden="true" className="-ml-0.5 size-4" />
              {createLabel[pageName] ?? labels.actions.edit}
            </ButtonLink>
          )}
        </>
      }
    />
  )
}
