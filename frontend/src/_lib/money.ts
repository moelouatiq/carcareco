const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "MAD",
});

/**
 * Formats an amount in the application currency, e.g. 1250 -> "1 250,00 MAD".
 *
 * The application is single-currency (MAD) in this version, so callers pass an amount only.
 * Returns an empty string when there is no amount, so screens that render nothing for a
 * missing price keep rendering nothing instead of a misleading "0,00 MAD".
 */
export function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return moneyFormatter.format(value);
}
