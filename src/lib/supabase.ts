/**
 * Supabase Client Utils
 * Server and browser clients for Supabase integration
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';

/**
 * Browser Client (Client-side)
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Server Client (Server-side / API routes)
 */
export function createServerSupabase(cookies: {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: { name: string; value: string; options?: any }[]) => void;
}) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookies.setAll(cookiesToSet);
        },
      },
    }
  );
}