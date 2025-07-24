// middleware.ts - Updated untuk menghindari warning

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware untuk static files dan assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/_next/webpack-hmr') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.') && !pathname.endsWith('/') ||
    pathname.startsWith('/api/files')
  ) {
    return NextResponse.next();
  }

  try {
    const { response, user } = await updateSession(request);

    // Public paths yang tidak memerlukan auth
    const publicPaths = ['/login', '/api/test'];
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return response;
    }

    // Protected roles
    const protectedRoles = ["admin", "direktur", "keuangan", "redaksi", "hrd", "marketing", "team"];
    const isProtectedRoute = protectedRoles.some(role => pathname.startsWith(`/${role}`));
    
    // Redirect ke login jika tidak ada user dan mengakses protected route
    if (!user && isProtectedRoute) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Redirect user yang sudah login dari halaman login
    if (user && pathname === "/login") {
      // Redirect ke dashboard default - bisa disesuaikan dengan role nanti di server component
      const dashboardUrl = new URL("/team", request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    // Fallback: allow request to continue
    return NextResponse.next();
  }
}

// Optimized matcher untuk menghindari middleware di static files
export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali yang dimulai dengan:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - _next/webpack-hmr (hot reload)
     * - favicon.ico
     * - file extensions (images, css, js, dll)
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)',
  ],
}