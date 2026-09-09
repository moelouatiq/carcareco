/**
 * Formats a percentage for display, e.g. 10 -> "10 %".
 *
 * Returns an empty string when there is no value, so a column with no percentage stays blank.
 * Zero is a real percentage and renders as "0 %": the older `value && '%'` idiom evaluated to
 * the number 0, which React then printed next to the value.
 */
export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} %`;
}
