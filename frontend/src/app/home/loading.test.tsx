import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Loading from './loading'
import { labels } from '@/_lib/labels'

describe('the loading state of the home section', () => {
  const html = () => renderToStaticMarkup(<Loading />)

  it('says it is loading, in French', () => {
    expect(html()).toContain(labels.common.loading)
    expect(html()).toContain('Chargement')
    expect(html()).not.toContain('Loading')
  })

  it('is announced as a status without repeating itself', () => {
    const markup = html()

    // Exactly one live region: the spinner inside it is decorative, so the wait is announced once.
    expect(markup.match(/role="status"/g)).toHaveLength(1)
    expect(markup).toContain('aria-live="polite"')
    expect(markup).toContain('aria-hidden="true"')
  })

  it('shows a spinner', () => {
    expect(html()).toContain('animate-spin')
  })

  it('leaves room for the sidebar instead of sliding under it', () => {
    // The same offset every page under /home uses, so the spinner sits where the content will.
    expect(html()).toContain('lg:pl-60')
  })

  it('centres itself in the content area', () => {
    const markup = html()

    expect(markup).toContain('items-center')
    expect(markup).toContain('justify-center')
  })

  it('covers the main area rather than overlaying the application', () => {
    const markup = html()

    expect(markup).toMatch(/^<main/)
    expect(markup).not.toContain('fixed')
    expect(markup).not.toContain('inset-0')
  })
})
