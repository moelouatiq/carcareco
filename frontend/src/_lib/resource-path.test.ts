import { describe, expect, it } from 'vitest'
import { resourceEditPath, resolveResourcePageName } from './resource-path'

describe('resource paths', () => {
  it('falls back to the API resource name when no page name is provided', () => {
    expect(resolveResourcePageName('vehicles')).toBe('vehicles')
    expect(resourceEditPath('vehicles', 'vehicle-id')).toBe(
      '/home/vehicles/edit/vehicle-id',
    )
  })

  it('uses an explicit page name when the UI route differs from the resource', () => {
    expect(resourceEditPath('inventoryitems', 'item/id', 'inventory')).toBe(
      '/home/inventory/edit/item%2Fid',
    )
  })
})
