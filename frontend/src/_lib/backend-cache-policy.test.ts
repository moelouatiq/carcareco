import { describe, expect, it } from 'vitest'
import { backendCacheControl } from './backend-cache-policy'

describe('backendCacheControl', () => {
  it('lets the browser keep the signed-in user avatar', () => {
    expect(backendCacheControl(['users', 'profilepicture'])).toBe('private, max-age=3600')
  })

  it('never allows a shared cache to hold it', () => {
    expect(backendCacheControl(['users', 'profilepicture'])).toContain('private')
    expect(backendCacheControl(['users', 'profilepicture'])).not.toContain('public')
  })

  // The point of the allowlist: widening it would put business data in a cache, so every one of
  // these has to keep coming back with no-store.
  it.each([
    ['clients', 'page'],
    ['vehicles', 'page'],
    ['work', 'page'],
    ['spareparts', 'page'],
    ['pricings', 'invoice', 'some-id', 'pdf'],
    ['pricings', 'offer', 'some-id', 'pdf'],
    ['users', 'authenticate'],
    ['users', 'profilepicture', 'something-else'],
  ])('does not cache %s', (...path: string[]) => {
    expect(backendCacheControl(path)).toBe('private, no-store')
  })

  it('is not fooled by casing', () => {
    expect(backendCacheControl(['Users', 'ProfilePicture'])).toBe('private, max-age=3600')
  })
})
