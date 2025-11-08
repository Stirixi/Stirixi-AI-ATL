import { AppHeader } from "@/components/app-header"
import { EngineerProfile } from "@/components/engineer-profile"
import { EngineerMetrics } from "@/components/engineer-metrics"

export default function ProspectiveHirePage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <EngineerProfile engineerId={params.id} isProspective />
          <EngineerMetrics engineerId={params.id} isProspective />
        </div>
      </main>
    </div>
  )
}
