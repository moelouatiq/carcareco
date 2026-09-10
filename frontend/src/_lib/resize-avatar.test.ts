import { describe, expect, it } from 'vitest'
import { AVATAR_MAX_DIMENSION, scaledSize } from './resize-avatar'

describe('scaledSize', () => {
  it('leaves a picture that is already small enough alone', () => {
    expect(scaledSize(120, 64)).toEqual({ width: 120, height: 64 })
    expect(scaledSize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION))
      .toEqual({ width: AVATAR_MAX_DIMENSION, height: AVATAR_MAX_DIMENSION })
  })

  it('brings a phone photograph down to the ceiling', () => {
    // What the limit exists for: a 12 megapixel picture is otherwise stored whole and sent to the
    // browser on every page.
    const { width, height } = scaledSize(4032, 3024)
    expect(Math.max(width, height)).toBe(AVATAR_MAX_DIMENSION)
  })

  it('keeps the aspect ratio', () => {
    const { width, height } = scaledSize(1000, 500)
    expect(width / height).toBeCloseTo(2, 2)
  })

  it('scales on the longest side whichever way the picture is turned', () => {
    expect(scaledSize(1000, 500)).toEqual({ width: 256, height: 128 })
    expect(scaledSize(500, 1000)).toEqual({ width: 128, height: 256 })
  })

  it('never produces a zero dimension from an extreme ratio', () => {
    const { width, height } = scaledSize(8000, 3)
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })

  it('agrees with the ceiling the server enforces', () => {
    // The server refuses anything above 256 on either side, from the bytes it receives. If these
    // ever disagree, an upload the browser considers fine is rejected on save.
    expect(AVATAR_MAX_DIMENSION).toBe(256)
  })
})
