import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { labels } from '@/_lib/labels'
import type { IActivities, IProduct, IWorkData } from '../model'
import Activity from './Activity'

vi.mock('@/_components/ui/ActionBar', () => ({
  ActionBar: ({ options }: { options: Array<{ name: string }> }) => (
    <div>{options.map((option) => <span key={option.name}>{option.name}</span>)}</div>
  ),
}))
vi.mock('./activity/IssueOfferDialog', () => ({ default: () => null }))
vi.mock('./activity/OfferAcceptedDialog', () => ({ default: () => null }))
vi.mock('./activity/SendPricingDialog', () => ({ default: () => null }))

const line: IProduct = {
  id: 'line-1',
  code: 'FILTER',
  name: 'Filtre à huile',
  quantity: 2,
  price: 80,
  unit: 'heure',
  discount: 15,
}

const work = {
  id: 'work-1',
  number: 'W-1',
  startedOn: new Date('2026-09-29T00:00:00Z'),
  startedBy: 'user-1',
  name: 'repairjob',
  isEmpty: false,
  clientId: 'client-1',
  clientName: 'Client',
  clientAddress: '',
  clientEmail: '',
  clientPhone: '',
  vehicleId: 'vehicle-1',
  vehicleProducer: '',
  vehicleModel: '',
  vehicleVin: '',
  vehicleRegNr: '',
  notes: '',
  odo: 0,
  mechanics: [],
  status: 'inprogress',
  issuance: undefined,
} as unknown as IWorkData

const activities: IActivities = {
  items: [
    {
      id: 'activity-1',
      number: 'A-1',
      startedOn: new Date('2026-09-29T00:00:00Z'),
      startedBy: 'user-1',
      name: 'repairjob',
      isEmpty: false,
    },
  ],
  current: {
    id: 'activity-1',
    notes: '',
    isVehicleLinesOnPricing: false,
    products: [line],
    priceSummary: { totalWithoutVat: 184, totalWithVat: 184 },
  },
}

describe('repair activity actions', () => {
  it('does not offer the global discount action while editing', () => {
    const markup = renderToStaticMarkup(
      <Activity
        edit
        work={work}
        activities={activities}
        startfresh={false}
      />,
    )

    expect(markup).toContain(labels.work.addRows)
    expect(markup).not.toContain('Appliquer une remise')
  })
})
