// lib/middleware/main.ts

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";

const roles = [
  "admin",
  "direktur",
  "keuangan",
  "redaksi",
  "hrd",
  "marketing",
  "team",
];

// Pastikan Anda menggunakan 'export', bukan 'export default'.
export async function mainMiddleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  if (!user) {
    if (roles.some((role) => pathname.startsWith(`/${role}`))) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  if (pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("Profile")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role;

  if (roles.some((role) => pathname.startsWith(`/${role}`) && role !== userRole)) {
    return NextResponse.redirect(new URL(`/${userRole || ""}`, request.url));
  }

  return response;
}