// middleware.ts (di root)

import { type NextRequest } from "next/server";

// Ini adalah jalur impor yang benar dan direkomendasikan
import { mainMiddleware } from "@/lib/middleware/main";

export function middleware(request: NextRequest) {
  return mainMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};