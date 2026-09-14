import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

// useLinkStatus only reports a pending navigation inside a real Link in a running router, which
// server rendering has none of. Mocking it is what makes both branches of this component
// reachable; the hook's own behaviour is Next's to guarantee, and the Preview run is what checks
// the two actually meet.
const pending = vi.fn(() => ({ pending: false }))
vi.mock('next/link', () => ({
  default: ({ children }: { children?: React.ReactNode }) => children,
  useLinkStatus: () => pending(),
}))

const { PendingLinkIcon, PendingLinkTrail } = await import('./PendingLinkIndicator')

const Icon = () => <svg data-icon="true" aria-hidden="true" />

describe('PendingLinkIcon', () => {
  beforeEach(() => pending.mockReturnValue({ pending: false }))

  it('shows the link its own icon while nothing is happening', () => {
    const html = renderToStaticMarkup(<PendingLinkIcon icon={<Icon />} />)

    expect(html).toContain('data-icon="true"')
    expect(html).not.toContain('animate-spin')
  })

  it('swaps the icon for a spinner while that link is loading', () => {
    pending.mockReturnValue({ pending: true })

    const html = renderToStaticMarkup(<PendingLinkIcon icon={<Icon />} />)

    expect(html).toContain('animate-spin')
    expect(html).not.toContain('data-icon="true"')
  })

  it('occupies the same box in both states, so the row does not move', () => {
    const idle = renderToStaticMarkup(<PendingLinkIcon icon={<Icon />} />)
    pending.mockReturnValue({ pending: true })
    const busy = renderToStaticMarkup(<PendingLinkIcon icon={<Icon />} />)

    expect(idle).toContain('size-[18px]')
    expect(busy).toContain('size-[18px]')
  })

  it('can match the smaller icon a button uses', () => {
    const html = renderToStaticMarkup(<PendingLinkIcon size="sm" icon={<Icon />} />)

    expect(html).toContain('size-4')
    expect(html).not.toContain('size-[18px]')
  })

  it('takes an offset without putting it on the icon itself', () => {
    expect(renderToStaticMarkup(<PendingLinkIcon className="-ml-0.5" icon={<Icon />} />))
      .toContain('-ml-0.5')
  })

  it('stays silent, because the link text is already the accessible name', () => {
    pending.mockReturnValue({ pending: true })

    const html = renderToStaticMarkup(<PendingLinkIcon icon={<Icon />} />)

    expect(html).not.toContain('role="status"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('Chargement')
  })
})

describe('PendingLinkTrail', () => {
  beforeEach(() => pending.mockReturnValue({ pending: false }))

  it('reserves its space while nothing is happening', () => {
    const html = renderToStaticMarkup(<PendingLinkTrail />)

    // Present but empty: a table cell keeps its width, so the column cannot reflow on a click.
    expect(html).toContain('size-4')
    expect(html).not.toContain('animate-spin')
  })

  it('spins in that same space while the link is loading', () => {
    pending.mockReturnValue({ pending: true })

    const html = renderToStaticMarkup(<PendingLinkTrail />)

    expect(html).toContain('animate-spin')
    expect(html).toContain('size-4')
  })

  it('stays silent for the same reason', () => {
    pending.mockReturnValue({ pending: true })

    const html = renderToStaticMarkup(<PendingLinkTrail />)

    expect(html).not.toContain('role="status"')
    expect(html).toContain('aria-hidden="true"')
  })
})
