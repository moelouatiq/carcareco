import { EncryptJWT, JWTPayload, jwtDecrypt } from 'jose'

export const MAX_SESSION_SECONDS = 12 * 60 * 60

export interface SessionPayload extends JWTPayload {
  apiRootJwt: string
  fullName: string
}

export function validateSessionInput(
  rootJwt: string,
  fullName: string,
  timeoutSeconds: number,
) {
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 60 || timeoutSeconds > MAX_SESSION_SECONDS) {
    throw new Error('Session timeout must be between 60 seconds and 12 hours')
  }
  if (!rootJwt || !fullName) throw new Error('Cannot create an incomplete session')
}

export function sessionCookieOptions(expires: Date, secure: boolean) {
  return {
    httpOnly: true,
    secure,
    expires,
    sameSite: 'lax' as const,
    path: '/',
  }
}

async function encryptionKey(secret: string) {
  if (!secret || secret.length < 32 || secret.startsWith('[')) {
    throw new Error('SESSION_SECRET must contain at least 32 non-placeholder characters')
  }

  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)),
  )
}

export async function encryptSession(
  payload: SessionPayload,
  expiresAt: Date,
  secret: string,
) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .encrypt(await encryptionKey(secret))
}

export async function decryptSession(session: string | undefined, secret: string) {
  if (!session) return null

  try {
    const { payload } = await jwtDecrypt<SessionPayload>(
      session,
      await encryptionKey(secret),
      { keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] },
    )
    return payload
  } catch {
    return null
  }
}
