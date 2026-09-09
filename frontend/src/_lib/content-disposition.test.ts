import { describe, expect, it } from "vitest";
import { parseContentDispositionFileName } from "./content-disposition";

describe("parseContentDispositionFileName", () => {
  it("reads the name the backend sends for invoices and estimates", () => {
    expect(parseContentDispositionFileName('attachment; filename="facture_7.pdf"')).toBe("facture_7.pdf");
    expect(parseContentDispositionFileName('inline; filename="facture_7.pdf"')).toBe("facture_7.pdf");
    expect(parseContentDispositionFileName('inline; filename="devis_3.pdf"')).toBe("devis_3.pdf");
  });

  it("accepts unquoted and extended forms", () => {
    expect(parseContentDispositionFileName("attachment; filename=facture_12.pdf")).toBe("facture_12.pdf");
    expect(parseContentDispositionFileName("attachment; filename*=UTF-8''facture_12.pdf")).toBe("facture_12.pdf");
  });

  it("returns null when there is no usable name", () => {
    expect(parseContentDispositionFileName(null)).toBeNull();
    expect(parseContentDispositionFileName(undefined)).toBeNull();
    expect(parseContentDispositionFileName("attachment")).toBeNull();
    expect(parseContentDispositionFileName('attachment; filename=""')).toBeNull();
  });

  it("never lets a header steer the download to another path", () => {
    expect(parseContentDispositionFileName('attachment; filename="../../etc/passwd"')).toBe("passwd");
    expect(parseContentDispositionFileName('attachment; filename="C:\\windows\\system32\\evil.exe"')).toBe("evil.exe");
    expect(parseContentDispositionFileName('attachment; filename=".."')).toBeNull();
  });
});
