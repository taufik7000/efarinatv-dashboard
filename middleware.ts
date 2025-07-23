import { type NextRequest } from "next/server";
import { mainMiddleware } from "@/lib/middleware/main";

export async function middleware(request: NextRequest) {
  return await mainMiddleware(request);
}

// More specific matcher to reduce middleware calls
export const config = {
  matcher: [
    /*
     * Match specific paths only:
     * - login page
     * - protected role routes
     * - root page
     * Exclude all static assets and API routes
     */
    '/',
    '/login/:path*',
    '/admin/:path*',
    '/direktur/:path*',
    '/keuangan/:path*',
    '/redaksi/:path*',
    '/hrd/:path*',
    '/marketing/:path*',
    '/team/:path*'
  ],
}