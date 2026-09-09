// The demo signup is the one backend call the marketing page made from the browser, which meant the
// browser had to know the API host. It goes through the server instead, so the backend stays
// reachable only from this application.
//
// It is deliberately not routed through /api/backend/[...path], which requires a session: this
// endpoint is anonymous by design. Keeping it separate means the generic proxy needs no
// unauthenticated exception, and this route can only ever reach the one path written below.
export async function POST(request: Request) {
  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error('API_URL env not set')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ message: 'Invalid request body' }, { status: 400 })
  }

  const backendResponse = await fetch(new URL('/api/Demo/setup', apiUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  // The page distinguishes 429 from other failures, so the status has to survive the hop.
  const responseHeaders = new Headers()
  const contentType = backendResponse.headers.get('content-type')
  if (contentType) responseHeaders.set('content-type', contentType)
  responseHeaders.set('Cache-Control', 'private, no-store')

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  })
}
