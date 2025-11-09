import { NextResponse } from 'next/server'
import { COOKIE_NAME, SessionUser } from '@/lib/auth'
import { cookies } from 'next/headers'

async function readSession(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const raw = store.get(COOKIE_NAME)?.value
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    return {
      email: parsed.email,
      connections: Array.isArray(parsed.connections)
        ? parsed.connections.filter((value): value is string => typeof value === 'string')
        : [],
    }
  } catch {
    return null
  }
}

function writeSessionCookie(payload: SessionUser, response: NextResponse) {
  response.cookies.set(COOKIE_NAME, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function GET() {
  const session = await readSession()
  return NextResponse.json({ signedIn: !!session, user: session })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({})) as Partial<SessionUser>
  const email = (body.email ?? '').toString().trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const existing = await readSession()
  const payload: SessionUser = {
    email,
    connections: existing?.email === email ? existing.connections ?? [] : [],
  }
  const res = NextResponse.json({ ok: true, user: payload })
  writeSessionCookie(payload, res)
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
  return res
}

export async function PATCH(req: Request) {
  const session = await readSession()
  if (!session) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as Partial<SessionUser>
  const incoming = Array.isArray(body.connections)
    ? body.connections.filter((value): value is string => typeof value === 'string')
    : null

  if (!incoming) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const connections = Array.from(new Set(incoming))
  const updated: SessionUser = { ...session, connections }
  const res = NextResponse.json({ ok: true, user: updated })
  writeSessionCookie(updated, res)
  return res
}
