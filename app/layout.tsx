import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { StirixiAIWidgetGate } from "@/components/stirixi-ai-widget-gate"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Stirixi",
    template: "%s | Stirixi",
  },
  description: "Stirixi unifies engineering delivery, hiring, and AI operations into one cockpit.",
  generator: "Stirixi Labs",
  icons: {
    icon: "/Stirixi_Logo.png",
    apple: "/Stirixi_Logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased overflow-y-scroll`}>
        {children}
        <StirixiAIWidgetGate />
        <Analytics />
      </body>
    </html>
  )
}
