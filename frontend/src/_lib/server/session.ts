import 'server-only'
import { cookies } from 'next/headers'
import {
  decryptSession,
  encryptSession,
  sessionCookieOptions,
  validateSessionInput,
} from '../session-crypto'

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32 || secret.startsWith('[')) {
    throw new Error('SESSION_SECRET must contain at least 32 non-placeholder characters')
  }
  return secret
}

export async function createSession(
  rootJwt: string,
  fullName: string,
  timeoutSeconds: number,
) {
  validateSessionInput(rootJwt, fullName, timeoutSeconds)

  const expiresAt = new Date(Date.now() + timeoutSeconds * 1000)
  const session = await encryptSession(
    { apiRootJwt: rootJwt, fullName },
    expiresAt,
    getSessionSecret(),
  )
  const cookieStore = await cookies()
  const secure = process.env.NODE_ENV === 'production'

  cookieStore.set('session', session, sessionCookieOptions(expiresAt, secure))
  cookieStore.set('session_timestamp', Date.now().toString(), {
    httpOnly: false,
    secure,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })

  // Remove the legacy browser-readable JWT cookie during rolling upgrades.
  cookieStore.set('jwt', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function getSession() {
  return decryptSession((await cookies()).get('session')?.value, getSessionSecret())
}

export async function getJwt() {
  const payload = await getSession()
  return typeof payload?.apiRootJwt === 'string' ? payload.apiRootJwt : null
}

/**
 * A short opaque token that changes with every login. It is appended to the avatar URL so that a
 * privately cached image can never be reused for a different account on a shared browser: the URL
 * itself differs. Derived from the session's own JWT, so it carries no readable information.
 */
export async function getProfileImageCacheKey() {
  const jwt = await getJwt()
  if (!jwt) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jwt))
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function getSessionFullName() {
  const payload = await getSession()
  return typeof payload?.fullName === 'string' ? payload.fullName : null
}
