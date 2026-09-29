import { labels } from '@/_lib/labels'
import { formatMoney } from '@/_lib/money'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { IProduct } from '../../model'
import Saleables from './Saleables'

const line: IProduct = {
  id: '18fb3bbc-647d-4d12-ac52-8a56636dd511',
  code: 'FILTER',
  name: 'Filtre à huile',
  quantity: 2,
  price: 80,
  unit: 'pièce',
  discount: 0,
}

function render(edit: boolean, item = line) {
  return renderToStaticMarkup(
    <Saleables
      edit={edit}
      data={[item]}
      priceSummary={{ totalWithoutVat: 160, totalWithVat: 160 }}
      tableRef={{ current: [] }}
      removeItem={() => undefined}
      refreshData={() => undefined}
    />
  )
}

function inputTag(markup: string, name: string): string {
  return markup.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0] ?? ''
}

describe('simplified work-line table', () => {
  it('does not render visible Unit or Discount columns or editors', () => {
    const markup = render(true)

    expect(markup).not.toContain(labels.common.unit)
    expect(markup).not.toContain(labels.common.discount)
    expect(inputTag(markup, 'unit')).toContain('type="hidden"')
    expect(inputTag(markup, 'discount')).toContain('type="hidden"')
  })

  it('keeps the useful fields, calculated total, and delete action', () => {
    const markup = render(true)

    expect(markup).toContain(labels.common.code)
    expect(markup).toContain(labels.common.name)
    expect(markup).toContain(labels.common.quantity)
    expect(markup).toContain(labels.common.price)
    expect(markup).toContain(labels.common.total)
    expect(markup).toContain(formatMoney(160))
    expect(markup).toContain(`aria-label="${labels.work.removeRow}"`)
    expect(inputTag(markup, 'quantity')).toContain('type="number"')
    expect(inputTag(markup, 'price')).toContain('type="number"')
  })

  it('preserves existing technical metadata in hidden fields', () => {
    const markup = render(true, { ...line, unit: 'heure', discount: 15 })

    expect(inputTag(markup, 'unit')).toContain('value="heure"')
    expect(inputTag(markup, 'discount')).toContain('value="15"')
  })
})
