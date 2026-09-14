import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Spinner from './Spinner'
import { labels } from '@/_lib/labels'

// Rendered for real rather than inspected as a description of itself, using the renderer React
// already ships. No DOM and no test library is needed for markup this small.
describe('Spinner', () => {
  it('announces itself in French when it stands alone', () => {
    const html = renderToStaticMarkup(<Spinner />)

    expect(html).toContain('role="status"')
    expect(html).toContain(labels.common.loading)
    expect(html).toContain('Chargement')
  })

  it('no longer says Loading', () => {
    // The application is in French; this string was the last English one left in the component.
    expect(renderToStaticMarkup(<Spinner />)).not.toContain('Loading')
  })

  it('takes a caller-supplied label', () => {
    expect(renderToStaticMarkup(<Spinner label="Préparation…" />)).toContain('Préparation…')
  })

  it('stays silent when a label is already beside it', () => {
    // An empty label makes it decorative, so a container that announces the wait is not echoed.
    const html = renderToStaticMarkup(<Spinner label="" />)

    expect(html).not.toContain('role="status"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain(labels.common.loading)
  })

  it('still spins, and still respects a reduced-motion preference', () => {
    const html = renderToStaticMarkup(<Spinner />)

    expect(html).toContain('animate-spin')
    expect(html).toContain('motion-reduce:')
  })

  it('keeps the white variant the dialog relies on', () => {
    expect(renderToStaticMarkup(<Spinner textWhite={true} />)).toContain('text-white')
    expect(renderToStaticMarkup(<Spinner />)).toContain('text-accent-ink')
  })
})
