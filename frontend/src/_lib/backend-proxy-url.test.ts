import { describe, expect, it } from 'vitest'
import { buildBackendProxyUrl } from './backend-proxy-url'

describe('backend proxy URL', () => {
  it('preserves ordinary query parameters without accepting a JWT argument', () => {
    const target = buildBackendProxyUrl(
      'https://api.example.invalid',
      ['clients', 'page'],
      'https://app.example.invalid/api/backend/clients/page?limit=30&offset=0',
    )

    expect(target.toString()).toBe('https://api.example.invalid/api/clients/page?limit=30&offset=0')
    expect(target.toString()).not.toMatch(/jwt|token|authorization/i)
  })

  it.each(['jwt', 'token', 'access_token', 'authorization'])(
    'rejects the sensitive query parameter %s',
    name => {
      expect(() => buildBackendProxyUrl(
        'https://api.example.invalid',
        ['users', 'profilepicture'],
        `https://app.example.invalid/api/backend/users/profilepicture?${name}=secret`,
      )).toThrow('Sensitive values')
    },
  )
})
