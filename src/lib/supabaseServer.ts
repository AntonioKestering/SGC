// src/lib/supabaseServer.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createRouteClient() {
  const cookieStore = await cookies()
  
  // LOG PARA DEBUG: Veja se aparece algum cookie no seu terminal (preto) do VS Code
  // console.log('Cookies presentes:', cookieStore.getAll().length > 0);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Silencioso se for Server Component
          }
        },
      },
    }
  )
}