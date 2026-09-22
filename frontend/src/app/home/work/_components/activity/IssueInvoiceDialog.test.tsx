import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import FormSwitch from '@/_components/FormSwitch'
import { labels } from '@/_lib/labels'
import { vehicleOnInvoice, vehicleOnInvoiceDefault } from './vehicleOnInvoice'

// The rule the dialog applies is imported, not restated: the dialog calls these same two
// functions, so a change to one is caught here rather than passing because the test kept its own
// copy of the logic.
const withVehicle = '2f0b1c3d-0000-0000-0000-000000000001'
const withoutVehicle = ''

describe('the vehicle choice when issuing an invoice', () => {
  it('offers the switch when the job has a vehicle', () => {
    expect(vehicleOnInvoice(withVehicle, true).offered).toBe(true)
  })

  it('does not offer it when there is no vehicle to show', () => {
    expect(vehicleOnInvoice(withoutVehicle, true).offered).toBe(false)
    expect(vehicleOnInvoice(null, true).offered).toBe(false)
    expect(vehicleOnInvoice(undefined, true).offered).toBe(false)
  })

  it('starts switched on, because a workshop invoice normally names the car', () => {
    expect(vehicleOnInvoiceDefault(withVehicle)).toBe(true)
  })

  it('starts off when there is no vehicle', () => {
    expect(vehicleOnInvoiceDefault(withoutVehicle)).toBe(false)
  })

  it('sends true when the garage leaves it on', () => {
    expect(vehicleOnInvoice(withVehicle, true).send).toBe(true)
  })

  it('sends false when the garage turns it off', () => {
    expect(vehicleOnInvoice(withVehicle, false).send).toBe(false)
  })

  it('sends false for a job with no vehicle, whatever the switch last held', () => {
    // The switch is not rendered in that case, so a stale toggle must not leak through.
    expect(vehicleOnInvoice(withoutVehicle, true).send).toBe(false)
    expect(vehicleOnInvoice(null, true).send).toBe(false)
  })

  it('never offers the switch without also refusing to send', () => {
    for (const id of [withoutVehicle, null, undefined]) {
      const choice = vehicleOnInvoice(id, true)
      expect(choice.offered).toBe(false)
      expect(choice.send).toBe(false)
    }
  })
})

describe('the switch itself', () => {
  const render = (checked: boolean) =>
    renderToStaticMarkup(
      <FormSwitch
        name="showVehicleOnInvoice"
        ariaLabel={labels.dialogs.showVehicleOnInvoice}
        checked={checked}
      />,
    )

  it('reuses the label that already existed rather than inventing a second one', () => {
    expect(labels.dialogs.showVehicleOnInvoice)
      .toBe('Afficher les informations du véhicule sur la facture')
  })

  it('carries an accessible name, since a switch renders as a bare button', () => {
    expect(render(true)).toContain(`aria-label="${labels.dialogs.showVehicleOnInvoice}"`)
  })

  it('looks different on and off', () => {
    expect(render(true)).not.toBe(render(false))
  })
})

describe('the body sent to the endpoint', () => {
  // Built the way the dialog builds it, from the same rule.
  const body = (vehicleId: string | null, chosen: boolean) => ({
    dueDays: 14,
    paymentType: 1,
    sendClientEmail: false,
    clientEmail: '',
    showVehicleOnInvoice: vehicleOnInvoice(vehicleId, chosen).send,
  })

  it('carries the choice alongside the fields the endpoint already expected', () => {
    expect(body(withVehicle, true)).toEqual({
      dueDays: 14,
      paymentType: 1,
      sendClientEmail: false,
      clientEmail: '',
      showVehicleOnInvoice: true,
    })
  })

  it('carries false when the vehicle is not to be shown', () => {
    expect(body(withVehicle, false).showVehicleOnInvoice).toBe(false)
    expect(body(null, true).showVehicleOnInvoice).toBe(false)
  })

  it('drops none of the existing fields', () => {
    expect(Object.keys(body(withVehicle, true)).sort()).toEqual(
      ['clientEmail', 'dueDays', 'paymentType', 'sendClientEmail', 'showVehicleOnInvoice'],
    )
  })
})
