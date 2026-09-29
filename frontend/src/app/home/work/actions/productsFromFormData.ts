import { NIL as NIL_UUID } from 'uuid'
import type { IProduct } from '../model'
import { DEFAULT_WORK_LINE_DISCOUNT, DEFAULT_WORK_LINE_UNIT } from '../workLine'

function stringValue(value: FormDataEntryValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

function numberValue(value: FormDataEntryValue | undefined, fallback = 0): number {
  if (typeof value !== 'string' || value.trim() === '') return fallback

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function productsFromFormData(formData: FormData): IProduct[] {
  const ids = formData.getAll('id')
  const codes = formData.getAll('part[code]')
  const names = formData.getAll('name')
  const prices = formData.getAll('price')
  const quantities = formData.getAll('quantity')
  const units = formData.getAll('unit')
  const discounts = formData.getAll('discount')

  return ids.map((formId, index) => {
    const id = stringValue(formId)
    const unit = stringValue(units[index])

    return {
      id: id.startsWith('-') ? NIL_UUID : id,
      code: stringValue(codes[index]),
      name: stringValue(names[index]),
      price: numberValue(prices[index]),
      quantity: numberValue(quantities[index]),
      unit: unit || DEFAULT_WORK_LINE_UNIT,
      discount: numberValue(discounts[index], DEFAULT_WORK_LINE_DISCOUNT),
    }
  })
}
