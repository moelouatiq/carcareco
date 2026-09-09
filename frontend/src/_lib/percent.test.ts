import { describe, expect, it } from "vitest";
import { formatPercent } from "./percent";

describe("formatPercent", () => {
  it("formats a percentage", () => {
    expect(formatPercent(10)).toBe("10 %");
    expect(formatPercent(5)).toBe("5 %");
    expect(formatPercent(100)).toBe("100 %");
  });

  it("renders zero as a real percentage, not as a stray 0", () => {
    expect(formatPercent(0)).toBe("0 %");
    expect(formatPercent(0)).not.toBe("0 0");
  });

  it("renders nothing when there is no value", () => {
    expect(formatPercent(null)).toBe("");
    expect(formatPercent(undefined)).toBe("");
    expect(formatPercent(Number.NaN)).toBe("");
  });

  it("rounds to whole percents", () => {
    expect(formatPercent(12.4)).toBe("12 %");
    expect(formatPercent(12.6)).toBe("13 %");
  });
});
