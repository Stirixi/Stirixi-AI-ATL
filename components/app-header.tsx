"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

export function AppHeader() {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/", label: "Integrations" },
  ]

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
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
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
