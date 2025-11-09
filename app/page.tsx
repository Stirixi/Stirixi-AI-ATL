import type { Metadata } from "next"

import { OnboardingPanel } from "@/components/onboarding-panel"
import { AppHeader } from "@/components/app-header"

export const metadata: Metadata = {
  title: "Integrations Onboarding",
  description: "Connect GitHub, IDE agents, and ticketing data sources to boot Stirixi in under a day.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8 flex justify-center items-start min-h-[calc(100vh-80px)]">
        <div className="max-w-2xl w-full mt-12">
          <OnboardingPanel />
        </div>
      </main>
    </div>
  )
}
