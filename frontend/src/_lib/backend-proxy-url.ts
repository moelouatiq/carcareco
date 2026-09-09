const allowedPathSegment = /^[a-zA-Z0-9._~-]+$/
const sensitiveQueryNames = new Set([
  'access_token',
  'authorization',
  'jwt',
  'refresh_token',
  'token',
])

export function buildBackendProxyUrl(
  apiUrl: string,
  path: string[],
  requestUrl: string,
) {
  if (!path.length || path.some(segment => !allowedPathSegment.test(segment))) {
    throw new Error('Invalid API path')
  }

  const incomingUrl = new URL(requestUrl)
  for (const name of incomingUrl.searchParams.keys()) {
    if (sensitiveQueryNames.has(name.toLowerCase())) {
      throw new Error('Sensitive values are not accepted in API query strings')
    }
  }

  const target = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, apiUrl)
  target.search = incomingUrl.search
  return target
}
