import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieEntry = { name: string; value: string }

type NextCookiesCompat = {
  getAll?: () => unknown
  setAll?: (cookies: Array<{ name: string; value: string; options?: CookieOptions }>) => void
  set?: (cookie: { name: string; value: string } & CookieOptions) => void
  get?: (name: string) => { name: string; value: string } | undefined
}

export async function createClient() {
  const nextCookies = (await cookies()) as unknown as NextCookiesCompat

  const cookieStore = {
    // Preferred API: return all cookies as { name, value }
    async getAll(): Promise<CookieEntry[]> {
      if (typeof nextCookies.getAll === 'function') {
        const raw = nextCookies.getAll()
        const resolved = await raw as Array<{ name?: string; value?: string }>
        return (resolved ?? []).map((c) => ({ name: c.name ?? '', value: c.value ?? '' }))
      }

      // Fallback: older Next runtimes may only expose `.get` per-cookie; we can't enumerate keys reliably.
      return []
    },

    // Preferred API: set multiple cookies at once
    async setAll(setCookies: Array<{ name: string; value: string; options?: CookieOptions }>) {
      if (typeof nextCookies.set === 'function') {
        // Older Next cookieStore exposes set; call per-cookie
        for (const { name, value, options } of setCookies) {
          try {
            nextCookies.set({ name, value, ...(options ?? {}) })
          } catch (err) {
            if (process.env.NODE_ENV !== 'production') console.error(err)
          }
        }
      } else if (typeof nextCookies.setAll === 'function') {
        try {
          nextCookies.setAll(setCookies)
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.error(err)
        }
      } else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('@supabase/ssr: createServerClient cookie setAll not available in this runtime')
        }
      }
    },
  }

  // Mark as used so static analysis doesn't flag them as unused
  void cookieStore.getAll
  void cookieStore.setAll

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieStore,
    }
  )
}