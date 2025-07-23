// app/api/test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'API route working',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL 
  });
}