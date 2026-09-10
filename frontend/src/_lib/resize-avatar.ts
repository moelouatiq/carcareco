// An avatar is drawn in a circle a few dozen pixels across, so a photograph straight from a phone
// is orders of magnitude larger than anything that can be seen. Scaling it down here, where the file
// already is, keeps any picture acceptable to the user while what reaches the database stays small.
// The server enforces the same ceiling from the bytes it receives: this is the convenience, not the
// guarantee.

export const AVATAR_MAX_DIMENSION = 256

/** Refuses to even decode something this large; a photograph never comes close. */
export const AVATAR_MAX_SOURCE_BYTES = 20 * 1024 * 1024

export function scaledSize(width: number, height: number, max = AVATAR_MAX_DIMENSION) {
  const longest = Math.max(width, height)
  if (longest <= max) return { width, height }
  const ratio = max / longest
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

/**
 * Returns a `data:image/png;base64,...` URL of the picture, no larger than AVATAR_MAX_DIMENSION on
 * its longest side. PNG rather than JPEG so a re-uploaded illustration picks up no artefacts; at
 * this size the difference in weight does not matter.
 */
export async function resizeAvatarToPngDataUrl(
  file: Blob,
  max = AVATAR_MAX_DIMENSION,
): Promise<string> {
  if (file.size > AVATAR_MAX_SOURCE_BYTES) {
    throw new Error('AVATAR_SOURCE_TOO_LARGE')
  }

  // from-image so a photo taken in portrait is not stored on its side.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const { width, height } = scaledSize(bitmap.width, bitmap.height, max)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('AVATAR_CANVAS_UNAVAILABLE')
    context.drawImage(bitmap, 0, 0, width, height)
    return canvas.toDataURL('image/png')
  } finally {
    bitmap.close()
  }
}
