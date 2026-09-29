import { NIL as NIL_UUID } from 'uuid'
import { describe, expect, it } from 'vitest'
import { productsFromFormData } from './actions/productsFromFormData'
import {
  calculateWorkLineTotal,
  createEmptyWorkLine,
  DEFAULT_WORK_LINE_DISCOUNT,
  DEFAULT_WORK_LINE_UNIT,
} from './workLine'

function appendEditableFields(formData: FormData, id: string, quantity: string, price: string) {
  formData.append('id', id)
  formData.append('part[code]', 'FILTER')
  formData.append('name', 'Filtre à huile')
  formData.append('quantity', quantity)
  formData.append('price', price)
}

describe('work-line defaults and payload', () => {
  it('creates a new line with the established technical unit and no discount', () => {
    expect(createEmptyWorkLine('-1')).toMatchObject({
      unit: DEFAULT_WORK_LINE_UNIT,
      discount: DEFAULT_WORK_LINE_DISCOUNT,
      quantity: 1,
    })
    expect(DEFAULT_WORK_LINE_UNIT).toBe('tk')
    expect(DEFAULT_WORK_LINE_DISCOUNT).toBe(0)
  })

  it('supplies safe technical values when the hidden metadata is absent', () => {
    const formData = new FormData()
    appendEditableFields(formData, '-1', '1', '300')

    expect(productsFromFormData(formData)).toEqual([
      {
        id: NIL_UUID,
        code: 'FILTER',
        name: 'Filtre à huile',
        quantity: 1,
        price: 300,
        unit: DEFAULT_WORK_LINE_UNIT,
        discount: 0,
      },
    ])
  })

  it("preserves an existing line's unit and non-zero discount", () => {
    const formData = new FormData()
    appendEditableFields(formData, '18fb3bbc-647d-4d12-ac52-8a56636dd511', '2', '80')
    formData.append('unit', 'heure')
    formData.append('discount', '15')

    expect(productsFromFormData(formData)[0]).toMatchObject({
      id: '18fb3bbc-647d-4d12-ac52-8a56636dd511',
      unit: 'heure',
      discount: 15,
    })
  })

  it('calculates quantity times price when no line discount applies', () => {
    expect(calculateWorkLineTotal(2, 80, 0)).toBe(160)
    expect(calculateWorkLineTotal(1, 300, 0)).toBe(300)
  })
})
