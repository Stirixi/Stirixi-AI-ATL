import { AppHeader } from "@/components/app-header"
import { EngineerProfile } from "@/components/engineer-profile"
import { EngineerMetrics } from "@/components/engineer-metrics"
import { EngineerActivity } from "@/components/engineer-activity"

function getPerformanceColor(score: number): string {
  if (score >= 7.5) return "#22c55e" // green
  if (score >= 5.0) return "#eab308" // yellow
  return "#ef4444" // red
}

export default async function EngineerPage({ params }: { params: { id: string } }) {
  const quarterlyData = [
    { quarter: "Q1 2024", performance: 7.8, companyAvg: 7.2 },
    { quarter: "Q2 2024", performance: 8.1, companyAvg: 7.4 },
    { quarter: "Q3 2024", performance: 8.5, companyAvg: 7.5 },
    { quarter: "Q4 2024", performance: 8.7, companyAvg: 7.5 },
  ]

  const { id } = await params

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <EngineerProfile engineerId={id} />
          <EngineerMetrics engineerId={id} />
          <EngineerActivity engineerId={id} />
        </div>
      </main>
    </div>
  )
}
