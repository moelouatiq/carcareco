import { describe, expect, it } from 'vitest'
import {
  decryptSession,
  encryptSession,
  sessionCookieOptions,
  validateSessionInput,
} from './session-crypto'

const sessionSecret = 'test-only-session-secret-with-at-least-32-characters'

describe('encrypted session', () => {
  it('round-trips the API token without exposing it in cookie plaintext', async () => {
    const apiToken = 'eyJ.test-only-api-token.signature'
    const encrypted = await encryptSession(
      { apiRootJwt: apiToken, fullName: 'Test User' },
      new Date(Date.now() + 60_000),
      sessionSecret,
    )

    expect(encrypted).not.toContain(apiToken)
    await expect(decryptSession(encrypted, sessionSecret)).resolves.toMatchObject({
      apiRootJwt: apiToken,
      fullName: 'Test User',
    })
  })

  it('rejects a tampered encrypted cookie', async () => {
    const encrypted = await encryptSession(
      { apiRootJwt: 'token', fullName: 'Test User' },
      new Date(Date.now() + 60_000),
      sessionSecret,
    )
    const parts = encrypted.split('.')
    parts[3] = `${parts[3][0] === 'a' ? 'b' : 'a'}${parts[3].slice(1)}`
    const tampered = parts.join('.')

    await expect(decryptSession(tampered, sessionSecret)).resolves.toBeNull()
  })

  it('enforces bounded duration and production cookie flags', () => {
    expect(() => validateSessionInput('token', 'Test User', 59)).toThrow()
    expect(() => validateSessionInput('token', 'Test User', 43_201)).toThrow()

    const expires = new Date(Date.now() + 60_000)
    expect(sessionCookieOptions(expires, true)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      expires,
    })
  })
})
