const genericApiError = 'API request failed'

export function sanitizeApiErrorMessage(message: unknown) {
  if (typeof message !== 'string' || !message.trim()) return genericApiError

  return message
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted-token]')
    .replace(/((?:password|secret|token|authorization|cookie)\s*[:=]\s*)[^\s,;]+/gi, '$1[redacted]')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 300)
}

export function apiErrorLocation(status: number) {
  const safeStatus = Number.isInteger(status) && status >= 400 && status <= 599
    ? status
    : 500
  return `/error?code=${safeStatus}`
}
