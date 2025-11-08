import { AppHeader } from "@/components/app-header"
import { ProjectHeader } from "@/components/project-header"
import { ProjectMetrics } from "@/components/project-metrics"
import { ProjectTeam } from "@/components/project-team"
import { ProjectTimeline } from "@/components/project-timeline"

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <ProjectHeader projectId={params.id} />
          <ProjectMetrics projectId={params.id} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProjectTimeline projectId={params.id} />
            </div>
            <div>
              <ProjectTeam projectId={params.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
