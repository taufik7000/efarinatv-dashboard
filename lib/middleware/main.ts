// lib/middleware/main.ts - Optimized for speed

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";
import { getRoleDashboardPath, isValidRole } from "@/lib/utils/role-redirect";

const protectedRoles = [
  "admin",
  "direktur", 
  "keuangan",
  "redaksi",
  "hrd",
  "marketing",
  "team",
];

// Expanded exclude paths for better performance
const excludePaths = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/.well-known',
  '/public',
  '/_vercel',
  '/static',
  '/images',
  '/icons',
  '/sw.js',
  '/manifest.json'
];

// Cache to reduce database calls (simple in-memory cache)
const roleCache = new Map<string, { role: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedUserRole(supabase: any, userId: string, userEmail: string): Promise<string> {
  // Check cache first
  const cached = roleCache.get(userId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.role;
  }

  try {
    // Single query to get role
    const { data: profile } = await supabase
      .from("Profile")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role || 'team';
    
    // Cache the result
    roleCache.set(userId, { role, timestamp: Date.now() });
    
    return role;
  } catch (error) {
    console.error('Error getting role:', error);
    return 'team'; // fallback
  }
}

export async function mainMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Quick exit for excluded paths
  if (excludePaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip middleware for file extensions
  if (pathname.includes('.') && !pathname.endsWith('/')) {
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf'].includes(ext || '')) {
      return NextResponse.next();
    }
  }

  try {
    const { response, user } = await updateSession(request);

    // No user - simple check
    if (!user) {
      if (protectedRoles.some((role) => pathname.startsWith(`/${role}`))) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return response;
    }

    // User logged in but accessing login page
    if (pathname === "/login") {
      const supabase = await createClient();
      const userRole = await getCachedUserRole(supabase, user.id, user.email || '');
      const dashboardPath = getRoleDashboardPath(userRole);
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Protected route authorization
    if (protectedRoles.some((role) => pathname.startsWith(`/${role}`))) {
      const supabase = await createClient();
      const userRole = await getCachedUserRole(supabase, user.id, user.email || '');
      const requestedRole = pathname.split('/')[1];
      
      // Only redirect if accessing wrong dashboard
      if (protectedRoles.includes(requestedRole) && requestedRole !== userRole) {
        const correctDashboard = getRoleDashboardPath(userRole);
        return NextResponse.redirect(new URL(correctDashboard, request.url));
      }
    }

    return response;
    
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}