import { getJwt } from '@/_lib/server/session'

interface RouteContext {
  params: Promise<{ path: string[] }>
}

export async function GET(request: Request, context: RouteContext) {
  const jwt = await getJwt()
  if (!jwt) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL env not set')

  const { path } = await context.params
  if (!path.length || path.some((segment) => !/^[a-zA-Z0-9._~-]+$/.test(segment))) {
    return Response.json({ message: 'Invalid API path' }, { status: 400 })
  }

  const target = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, apiUrl)
  target.search = new URL(request.url).search

  const backendResponse = await fetch(target, {
    method: 'GET',
    headers: {
      Accept: request.headers.get('accept') ?? 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    cache: 'no-store',
  })

  const responseHeaders = new Headers()
  for (const name of ['content-type', 'content-disposition', 'content-length']) {
    const value = backendResponse.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }
  responseHeaders.set('Cache-Control', 'private, no-store')

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  })
}
