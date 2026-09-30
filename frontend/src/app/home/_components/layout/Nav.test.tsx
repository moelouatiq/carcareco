import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import Nav from './Nav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/home/work',
}))

describe('navigation branding', () => {
  it('uses the complete garage logo in desktop and mobile navigation', () => {
    for (const onSmallScreen of [false, true]) {
      const html = renderToStaticMarkup(
        <Nav
          onSmallScreen={onSmallScreen}
          fullName="Test User"
          imageUrl="/test-user.png"
        />,
      )

      expect(html).toContain('othman-benhicham-logo.webp')
      expect(html).toContain('Othman Benhicham — Mécanique &amp; Diagnostic Auto')
      expect(html).not.toContain('logo.png')
      expect(html).not.toContain('Solution Mécanique')
    }
  })
})
