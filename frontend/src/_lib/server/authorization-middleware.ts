 
import { NextResponse, NextRequest } from 'next/server'
import { getJwt } from '@/_lib/server/session'
export default async function authorizationMiddleware(request: NextRequest,response: NextResponse) {
  
   // 2. Check if the current route is protected or public
   const path = request.nextUrl.pathname
   const isProtectedRoute = path.startsWith('/home');
    // 3. Decrypt the session from the cookie
   
   // logout if /home/logout is called and redirect to login page
  if (path.includes("/home/logout")) { 
    const logoutResponse = NextResponse.redirect(new URL('/auth/login', request.url))
    const secure = process.env.NODE_ENV === 'production'
    for (const name of ['session', 'session_timestamp', 'jwt']) {
      logoutResponse.cookies.set(name, '', {
        httpOnly: name !== 'session_timestamp',
        secure,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
    }
    return logoutResponse
  }

  const jwt =await getJwt();
  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !jwt) {
    return NextResponse.redirect(new URL('/auth/login', request.nextUrl))
  }
 
  // 5. Redirect to /home if the user is authenticated
  if (
    !isProtectedRoute && jwt
  ) {
    return NextResponse.redirect(new URL('/home/work', request.nextUrl))
  }

  return response
}
