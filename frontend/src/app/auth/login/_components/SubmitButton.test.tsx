import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import SubmitButton from './SubmitButton'
import { labels } from '@/_lib/labels'

describe('SubmitButton', () => {
  const idle = () => renderToStaticMarkup(<SubmitButton isPending={false} />)
  const pending = () => renderToStaticMarkup(<SubmitButton isPending={true} />)

  // The class list carries disabled:* variants, so the attribute has to be matched, not the word.
  const isDisabled = (html: string) => /<button[^>]*\sdisabled(?:=""|\s|>)/.test(html)

  it('invites the sign-in before anything is happening', () => {
    const html = idle()

    expect(html).toContain(labels.auth.signIn)
    expect(html).toContain('Se connecter')
    expect(html).not.toContain(labels.auth.signingIn)
  })

  it('is usable before anything is happening', () => {
    const html = idle()

    expect(isDisabled(html)).toBe(false)
    expect(html).toContain('aria-busy="false"')
    expect(html).not.toContain('animate-spin')
  })

  it('says what it is doing while the action runs', () => {
    const html = pending()

    expect(html).toContain(labels.auth.signingIn)
    expect(html).toContain('Connexion')
    expect(html).not.toContain('Se connecter')
  })

  it('shows a spinner while the action runs', () => {
    expect(pending()).toContain('animate-spin')
  })

  it('cannot be pressed again while the action runs', () => {
    // Being disabled is what prevents a second authentication: a further click has no target.
    const html = pending()

    expect(isDisabled(html)).toBe(true)
    expect(html).toContain('aria-busy="true"')
  })

  it('does not announce the wait twice', () => {
    // The button's own text already says "Connexion…", so the spinner inside it stays decorative.
    const html = pending()

    expect(html).not.toContain('role="status"')
    expect(html).toContain('aria-hidden="true"')
  })

  it('keeps its full width in both states, so the layout does not jump', () => {
    expect(idle()).toContain('w-full')
    expect(pending()).toContain('w-full')
  })

  it('submits the form it belongs to', () => {
    expect(idle()).toContain('type="submit"')
  })
})
