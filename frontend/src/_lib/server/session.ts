import 'server-only'
import { cookies } from 'next/headers'
import { EncryptJWT, JWTPayload, jwtDecrypt } from 'jose'

const MAX_SESSION_SECONDS = 12 * 60 * 60

interface SessionPayload extends JWTPayload {
  apiRootJwt: string
  fullName: string
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32 || secret.startsWith('[')) {
    throw new Error('SESSION_SECRET must contain at least 32 non-placeholder characters')
  }
  return secret
}

async function getEncryptionKey() {
  return new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(getSessionSecret()),
    ),
  )
}

async function encrypt(payload: SessionPayload, expiresAt: Date) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .encrypt(await getEncryptionKey())
}

async function decrypt(session: string | undefined) {
  if (!session) return null

  try {
    const { payload } = await jwtDecrypt<SessionPayload>(
      session,
      await getEncryptionKey(),
      { keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] },
    )
    return payload
  } catch {
    return null
  }
}

function validateTimeout(timeoutSeconds: number) {
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 60 || timeoutSeconds > MAX_SESSION_SECONDS) {
    throw new Error('Session timeout must be between 60 seconds and 12 hours')
  }
}

export async function createSession(
  rootJwt: string,
  fullName: string,
  timeoutSeconds: number,
) {
  validateTimeout(timeoutSeconds)
  if (!rootJwt || !fullName) throw new Error('Cannot create an incomplete session')

  const expiresAt = new Date(Date.now() + timeoutSeconds * 1000)
  const session = await encrypt({ apiRootJwt: rootJwt, fullName }, expiresAt)
  const cookieStore = await cookies()
  const secure = process.env.NODE_ENV === 'production'

  cookieStore.set('session', session, {
    httpOnly: true,
    secure,
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
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
  return decrypt((await cookies()).get('session')?.value)
}

export async function getJwt() {
  const payload = await getSession()
  return typeof payload?.apiRootJwt === 'string' ? payload.apiRootJwt : null
}

export async function getSessionFullName() {
  const payload = await getSession()
  return typeof payload?.fullName === 'string' ? payload.fullName : null
}
