import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Check for admin routes
    if (req.nextUrl.pathname.startsWith('/admin')) {
      const token = req.nextauth.token
      
      // Check if user is admin
      if (token?.email !== 'admin@creatorapp.com') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/api/admin/:path*'
  ]
}
