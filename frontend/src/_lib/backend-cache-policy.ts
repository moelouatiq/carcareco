// Everything the backend proxy returns is private, and most of it changes: works, clients,
// vehicles, stock, invoices and estimates must never be held anywhere. The one exception is the
// signed-in user's own avatar, which does not change within a session and is by far the largest
// response the proxy carries.
//
// It is let into the browser's cache only, never a shared one, and the layout appends a per-login
// key to its URL, so a cached image cannot be handed to a different account on the same browser.
const browserCacheable = new Set(['users/profilepicture'])

const ONE_HOUR = 3600

export function backendCacheControl(path: string[]): string {
  return browserCacheable.has(path.join('/').toLowerCase())
    ? `private, max-age=${ONE_HOUR}`
    : 'private, no-store'
}
