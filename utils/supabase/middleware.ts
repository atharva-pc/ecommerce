import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type CookieAccessor = {
  getAll?: () => Array<{ name?: string; value?: string }>
  set?: (cookie: { name: string; value: string } & CookieOptions) => void
}

function parseCookieHeader(header: string | null) {
  if (!header) return [] as Array<{ name: string; value: string }>
  return header.split(';').map((pair) => {
    const idx = pair.indexOf('=')
    const name = pair.slice(0, idx).trim()
    const value = pair.slice(idx + 1).trim()
    return { name, value }
  })
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const cookieAccessor = request.cookies as CookieAccessor

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Preferred API: return all cookies as { name, value }
        async getAll() {
          if (typeof cookieAccessor.getAll === 'function') {
            const raw = cookieAccessor.getAll()
            const resolved = await Promise.resolve(raw)
            return (resolved ?? []).map((c) => ({ name: c.name ?? '', value: c.value ?? '' }))
          }

          // Fallback: parse Cookie header
          return parseCookieHeader(request.headers.get('cookie'))
        },

        // Preferred API: set multiple cookies at once
        async setAll(setCookies: Array<{ name: string; value: string; options?: CookieOptions }>) {
          for (const { name, value, options } of setCookies) {
            // update incoming request cookies if supported
            try {
              if (typeof cookieAccessor.set === 'function') {
                cookieAccessor.set({ name, value, ...(options ?? {}) })
              }
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') console.error(err)
            }

            // ensure response carries cookie changes
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            try {
              response.cookies.set({ name, value, ...(options ?? {}) })
            } catch (err) {
              if (process.env.NODE_ENV !== 'production') console.error(err)
            }
          }
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}