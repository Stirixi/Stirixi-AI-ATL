'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/integrations', label: 'Integrations' },
  ];

  useEffect(() => {
    let mounted = true
    fetch('/api/session')
      .then((r) => r.json())
      .then((d) => { if (mounted) setSignedIn(!!d?.signedIn) })
      .catch(() => { if (mounted) setSignedIn(false) })
    return () => { mounted = false }
  }, [])

  const signOut = async () => {
    await fetch('/api/session', { method: 'DELETE' })
    setSignedIn(false)
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/Stirixi_Logo.png"
              alt="Stirixi Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <h1 className="text-lg font-semibold text-foreground">Stirixi</h1>
          </Link>
          <nav className="flex items-center gap-6">
            {signedIn &&
              navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm transition-colors ${
                      isActive
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            {signedIn === false && (
              <Link
                href="/login"
                className={`text-sm transition-colors ${
                  pathname === '/login'
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign in
              </Link>
            )}
            {signedIn && (
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
