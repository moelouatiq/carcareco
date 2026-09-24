import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Home from './page'
import LoginPage from './auth/login/page'

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('./auth/login/authenticate', () => ({
  authenticate: vi.fn(),
}))

describe('the root route', () => {
  beforeEach(() => {
    redirectMock.mockClear()
  })

  it('redirects to the login page during server rendering', () => {
    expect(() => Home()).toThrow('NEXT_REDIRECT')
    expect(redirectMock).toHaveBeenCalledOnce()
    expect(redirectMock).toHaveBeenCalledWith('/auth/login')
  })

  it('stops rendering before any landing-page content is produced', () => {
    expect(() => Home()).toThrow('NEXT_REDIRECT')
  })
})

describe('the login destination', () => {
  it('still renders the themed sign-in form', () => {
    const html = renderToStaticMarkup(<LoginPage />)

    expect(html).toContain('<form')
    expect(html).toContain('name="username"')
    expect(html).toContain('name="password"')
    expect(html).toContain('Se connecter')
    expect(html).toContain('bg-surface')
    expect(html).not.toContain('Un atelier moderne')
  })
})
