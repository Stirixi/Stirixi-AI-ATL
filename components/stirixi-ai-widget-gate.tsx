'use client'

import { usePathname } from 'next/navigation'

import { StirixiAIWidget } from '@/components/stirixi-ai-widget'

const ALLOWED_PREFIXES = ['/dashboard', '/engineers', '/projects', '/prospective'] as const

function isAllowedPath(pathname: string) {
  return ALLOWED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

export function StirixiAIWidgetGate() {
  const pathname = usePathname() ?? '/'
  if (!isAllowedPath(pathname)) {
    return null
  }
  return <StirixiAIWidget />
}
