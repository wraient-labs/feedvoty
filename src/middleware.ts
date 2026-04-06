import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ──────────────────────────────────────────────
// Middleware: domain-based workspace resolution + CORS
// ──────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // ── CORS preflight ──────────────────────────
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    setCorsHeaders(request, response)
    return response
  }

  // ── API routes — pass through with CORS ─────
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    setCorsHeaders(request, response)
    return response
  }

  // ── Custom-domain resolution ────────────────
  // Requests that are NOT on the canonical app domain are treated as
  // embedded feedback boards for a workspace that registered that
  // domain.  We rewrite them to /workspace/[slug] so a single page
  // component handles both.
  const canonicalDomain = process.env.APP_DOMAIN || 'feedback.yourdomain.com'
  const isCanonical = hostname === canonicalDomain || hostname === 'localhost'

  if (!isCanonical && !hostname.startsWith('localhost')) {
    // This is a custom-domain request.
    // The page component will look up the workspace by custom_domain.
    // Rewrite to /workspace/_custom_domain so the page knows to resolve dynamically.
    const rewriteUrl = new URL(`/workspace/_custom_domain`, request.url)
    rewriteUrl.searchParams.set('domain', hostname)
    return NextResponse.rewrite(rewriteUrl)
  }

  // ── Canonical domain — normal routing ───────
  return NextResponse.next()
}

// ──────────────────────────────────────────────
// CORS helper
// ──────────────────────────────────────────────
function setCorsHeaders(request: NextRequest, response: NextResponse) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*']

  const origin = request.headers.get('origin') || ''

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Workspace-Id'
  )
  response.headers.set('Access-Control-Max-Age', '86400')
}

// Only run middleware on API routes and custom-domain requests
export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
