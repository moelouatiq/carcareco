/**
 * Reads the file name a backend response asks the browser to save under.
 *
 * The document name is owned by the backend domain (facture_7.pdf / devis_3.pdf); the frontend
 * reads it from the header instead of rebuilding a second, drifting convention.
 */
export function parseContentDispositionFileName(header: string | null | undefined): string | null {
  if (!header) return null;

  const extended = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header);
  if (extended) {
    try {
      return sanitize(decodeURIComponent(extended[1]));
    } catch {
      // Malformed percent-encoding: fall back to the plain filename parameter below.
    }
  }

  const quoted = /filename\s*=\s*"([^"]*)"/i.exec(header);
  if (quoted) return sanitize(quoted[1]);

  const bare = /filename\s*=\s*([^;]+)/i.exec(header);
  return bare ? sanitize(bare[1]) : null;
}

/** Keeps the base name only, so a header can never steer a download to another path. */
function sanitize(value: string): string | null {
  const base = value.trim().split(/[\\/]/).pop()?.trim() ?? "";
  return base && base !== "." && base !== ".." ? base : null;
}
