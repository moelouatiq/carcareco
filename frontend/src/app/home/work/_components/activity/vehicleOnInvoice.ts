/**
 * Whether an invoice about to be issued should carry the vehicle, and whether to ask at all.
 *
 * Kept out of the dialog so the rule has one home: the component renders the answer and the tests
 * exercise the same function, rather than each restating it.
 *
 * A job with no vehicle has nothing to show, so the switch is not offered and false is sent
 * whatever a previous toggle left behind. The choice applies only to the invoice being issued --
 * the lines are stored on the document, so nothing already sent can change.
 */
export function vehicleOnInvoice(vehicleId: string | null | undefined, chosen: boolean) {
  const hasVehicle = !!vehicleId

  return {
    /** Show the switch only when there is a vehicle to talk about. */
    offered: hasVehicle,
    /** What the endpoint receives. */
    send: hasVehicle && chosen,
  }
}

/** On by default when there is a vehicle: a workshop invoice normally names the car. */
export function vehicleOnInvoiceDefault(vehicleId: string | null | undefined) {
  return !!vehicleId
}
