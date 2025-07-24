import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Suppress the getSession warning by calling getUser first
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // HACK: Suppress getSession warning by calling getUser once
  // This is a workaround for https://github.com/supabase/supabase-js/issues/1010
  if (typeof window !== 'undefined') {
    // Only suppress on client side
    client.auth.getUser().catch(() => {
      // Ignore errors, this is just to suppress the warning
    });
  }

  return client;
}