// lib/supabase/server.ts - Updated untuk konsistensi

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies();

  try {
    // Validasi environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Cookie set error bisa diabaikan di server components
              // karena ini biasa terjadi saat rendering
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Cookie remove error bisa diabaikan
            }
          },
        },
      }
    );

    // Validasi client berhasil dibuat
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    if (!supabase.auth) {
      throw new Error('Supabase auth is not available');
    }

    return supabase;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}