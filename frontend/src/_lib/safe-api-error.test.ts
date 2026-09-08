import { describe, expect, it } from 'vitest'
import { apiErrorLocation, sanitizeApiErrorMessage } from './safe-api-error'

describe('API error redaction', () => {
  it('redacts authorization tokens, JWTs, passwords, and line breaks', () => {
    const unsafe = [
      'Authorization: Bearer super-secret-token',
      'jwt=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature',
      'password=hunter2',
    ].join('\n')

    const safe = sanitizeApiErrorMessage(unsafe)

    expect(safe).not.toContain('super-secret-token')
    expect(safe).not.toContain('eyJhbGciOiJIUzI1NiJ9')
    expect(safe).not.toContain('hunter2')
    expect(safe).not.toContain('\n')
  })

  it('only places a validated status code in the error URL', () => {
    expect(apiErrorLocation(401)).toBe('/error?code=401')
    expect(apiErrorLocation(Number.NaN)).toBe('/error?code=500')
  })
})
