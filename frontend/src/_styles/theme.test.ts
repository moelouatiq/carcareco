import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Read rather than imported: these are CSS custom properties, and what matters is the value that
// actually ships in the stylesheet.
const css = readFileSync(join(process.cwd(), 'src/_styles/tailwind.css'), 'utf8')

function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)
  if (!match) throw new Error(`--color-${name} is not defined`)
  return match[1].toLowerCase()
}

/** WCAG relative luminance, so a ratio can be computed rather than eyeballed. */
function luminance(hex: string): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const AA = 4.5

describe('the application palette', () => {
  const surfaces = ['app', 'surface', 'sidebar', 'field'] as const

  it.each(surfaces)('%s is not white', name => {
    // The whole point of this theme: a workshop screen looked at all day should not be lit up
    // like a sheet of paper.
    expect(token(name)).not.toBe('#ffffff')
    expect(luminance(token(name))).toBeLessThan(0.94)
  })

  it.each(surfaces)('%s is still a light surface, not a dark one', name => {
    // Softening the glare must not turn into a dark theme, which is not what was asked for.
    expect(luminance(token(name))).toBeGreaterThan(0.6)
  })

  it.each([
    ['ink', 'surface'],
    ['ink', 'app'],
    ['ink', 'sidebar'],
    ['ink', 'field'],
    ['muted', 'surface'],
    ['muted', 'app'],
    ['muted', 'sidebar'],
    ['muted', 'field'],
    ['accent-ink', 'surface'],
    ['accent-ink', 'app'],
  ])('%s on %s clears AA', (text, background) => {
    expect(contrast(token(text), token(background))).toBeGreaterThanOrEqual(AA)
  })

  it('reads the primary button as ink on amber, never white on amber', () => {
    // White on this amber sits at 2.17:1; ink on it is the pairing that passes.
    expect(contrast(token('ink'), token('accent'))).toBeGreaterThanOrEqual(AA)
    expect(contrast('#ffffff', token('accent'))).toBeLessThan(3)
  })

  it.each(['success', 'danger', 'info', 'neutral'])('the %s badge is readable', tone => {
    expect(contrast(token(`${tone}-ink`), token(`${tone}-soft`))).toBeGreaterThanOrEqual(AA)
  })

  it.each(['success', 'danger', 'info', 'neutral', 'accent'])(
    'the %s badge does not become the brightest thing on the page',
    tone => {
      // Left near white, these small blocks would out-glare the card they sit on, which is the
      // glare this palette exists to remove.
      expect(luminance(token(`${tone}-soft`))).toBeLessThanOrEqual(luminance(token('surface')))
    },
  )

  it('keeps a field distinguishable from the card it sits on', () => {
    expect(token('field')).not.toBe(token('surface'))
    expect(luminance(token('field'))).toBeGreaterThan(luminance(token('surface')))
  })

  it('separates a card from the page behind it', () => {
    expect(luminance(token('surface'))).toBeGreaterThan(luminance(token('app')))
  })

  it('draws a visible hairline', () => {
    expect(contrast(token('line'), token('surface'))).toBeGreaterThan(1.5)
    expect(contrast(token('line-strong'), token('surface'))).toBeGreaterThan(2)
  })

  it('shows a focus ring against every surface', () => {
    // A ring is not text: three to one is the threshold that applies to it.
    for (const surface of surfaces) {
      expect(contrast(token('accent-ink'), token(surface))).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps the workshop amber unchanged', () => {
    expect(token('accent')).toBe('#e8a317')
  })

  it('stays warm rather than drifting cool', () => {
    // Red above blue is what makes a neutral read as warm; the brief asked for neutre et chaud.
    for (const name of surfaces) {
      const hex = token(name)
      const red = parseInt(hex.slice(1, 3), 16)
      const blue = parseInt(hex.slice(5, 7), 16)
      expect(red).toBeGreaterThan(blue)
    }
  })

  it('has no dark mode machinery', () => {
    // A softer light theme was asked for, explicitly not a dark one. The mechanisms are what is
    // asserted, not the word: the prose above the palette says "without making anything dark".
    expect(css).not.toContain('prefers-color-scheme')
    expect(css).not.toContain('data-theme')
    expect(css).not.toMatch(/\.dark/)
    expect(css).not.toMatch(/\sdark:[a-z-]+/)
  })
})
