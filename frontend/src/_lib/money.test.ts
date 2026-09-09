import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats amounts in MAD with French grouping and decimals", () => {
    // Narrow no-break space (U+202F) groups thousands, no-break space (U+00A0) precedes MAD.
    expect(formatMoney(1250)).toBe("1 250,00 MAD");
    expect(formatMoney(350)).toBe("350,00 MAD");
    expect(formatMoney(1234567.891)).toBe("1 234 567,89 MAD");
  });

  it("formats zero and negative amounts", () => {
    expect(formatMoney(0)).toBe("0,00 MAD");
    expect(formatMoney(-42.5)).toBe("-42,50 MAD");
  });

  it("renders nothing when there is no amount", () => {
    expect(formatMoney(null)).toBe("");
    expect(formatMoney(undefined)).toBe("");
    expect(formatMoney(Number.NaN)).toBe("");
  });

  it("never falls back to another currency", () => {
    for (const value of [0, 1, 1250, -3]) {
      expect(formatMoney(value)).toContain("MAD");
      expect(formatMoney(value)).not.toContain("EUR");
      expect(formatMoney(value)).not.toContain("€");
    }
  });
});
