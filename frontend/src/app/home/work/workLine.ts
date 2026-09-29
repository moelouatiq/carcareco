import type { IProduct } from './model'

// This is the technical unit the work-entry screen already used for every new row.
// It remains part of the API payload even though it is no longer entered by the user.
export const DEFAULT_WORK_LINE_UNIT = 'tk'
export const DEFAULT_WORK_LINE_DISCOUNT = 0

export function createEmptyWorkLine(id: string): IProduct {
  return {
    id,
    code: '',
    discount: DEFAULT_WORK_LINE_DISCOUNT,
    name: '',
    price: null,
    quantity: 1,
    unit: DEFAULT_WORK_LINE_UNIT,
  }
}

export function calculateWorkLineTotal(
  quantity: number | null,
  price: number | null,
  discount: number | null
): number | null {
  if (quantity === null || price === null) return null

  // Keep the legacy domain calculation for historical/global discounts. New rows use zero,
  // which makes their total simply quantity x price.
  return quantity * price * ((100 + (discount ?? DEFAULT_WORK_LINE_DISCOUNT)) / 100)
}
