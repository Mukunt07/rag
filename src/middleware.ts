import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Better Auth uses different cookies for http and https
  const sessionToken = 
    request.cookies.get("better-auth.session_token")?.value || 
    request.cookies.get("__Secure-better-auth.session_token")?.value;
    
  const pathname = request.nextUrl.pathname;
  
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/documents') || 
                           pathname.startsWith('/notes') || 
                           pathname.startsWith('/quiz') || 
                           pathname.startsWith('/workspace') ||
                           pathname.startsWith('/settings');
  
  // If user is not logged in, redirect them to login page when accessing protected routes
  if (!sessionToken) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // If user is logged in, prevent access to login/register pages
  if (isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
