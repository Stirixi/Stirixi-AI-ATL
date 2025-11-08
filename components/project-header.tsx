import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "lucide-react"

function getPerformanceColor(score: number): string {
  if (score >= 7.5) {
    return "text-green-500"
  } else if (score >= 5.0) {
    return "text-yellow-500"
  } else {
    return "text-red-500"
  }
}

function getPerformanceGradient(score: number): string {
  if (score >= 7.5) {
    return "from-green-500/20 to-green-500/5"
  } else if (score >= 5.0) {
    return "from-yellow-500/20 to-yellow-500/5"
  } else {
    return "from-red-500/20 to-red-500/5"
  }
}

export function ProjectHeader({ projectId }: { projectId: string }) {
  // Mock data
  const project = {
    name: "Authentication Service",
    description: "OAuth2 and SSO implementation for enterprise customers",
    status: "active",
    performance: 8.4,
    startDate: "Jan 2024",
    targetDate: "Mar 2024",
    repository: "github.com/company/auth-service",
  }

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
          </div>
          <p className="text-muted-foreground mb-4">{project.description}</p>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Started: </span>
              <span className="text-foreground">{project.startDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span className="text-foreground">{project.targetDate}</span>
            </div>
            <a
              href={`https://${project.repository}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <span>Repository</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Overall Performance</span>
          <span className={`text-3xl font-bold ${getPerformanceColor(project.performance)}`}>
            {project.performance.toFixed(1)}
          </span>
        </div>
      </div>
    </Card>
  )
}
