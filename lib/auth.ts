import { cookies } from 'next/headers'

export type SessionUser = {
  email: string
  connections?: string[]
}

const COOKIE_NAME = 'session'

function normalizeSession(user: SessionUser | null): SessionUser | null {
  if (!user?.email) return null
  const connections = Array.isArray(user.connections)
    ? user.connections.filter((value): value is string => typeof value === 'string')
    : []
  return { email: user.email, connections }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const raw = store.get(COOKIE_NAME)?.value
    if (!raw) return null
    const parsed = JSON.parse(raw) as SessionUser
    return normalizeSession(parsed)
  } catch {
    return null
  }
}

export async function hasSession(): Promise<boolean> {
  return (await getSessionUser()) !== null
}

export { COOKIE_NAME }
