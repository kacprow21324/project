import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options)
        })
      }
    }
  }
)

  const { data: { session } } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname

  // niezalogowany → blokuj dashboard
  if (!session && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // zalogowany → blokuj login/register
  if (session && (path.startsWith('/login') || path.startsWith('/register'))) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
}