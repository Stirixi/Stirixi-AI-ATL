import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Users } from "lucide-react"
import Link from "next/link"

function getPerformanceColor(score: number): string {
  if (score >= 7.5) {
    return "text-green-500"
  } else if (score >= 5.0) {
    return "text-yellow-500"
  } else {
    return "text-red-500"
  }
}

export function ProjectsList() {
  const projects = [
    {
      id: 1,
      name: "Authentication Service",
      description: "OAuth2 and SSO implementation",
      status: "active",
      performance: 8.4,
      engineers: 5,
      commits: 128,
    },
    {
      id: 2,
      name: "Analytics Dashboard",
      description: "Real-time metrics and reporting",
      status: "active",
      performance: 7.2,
      engineers: 4,
      commits: 94,
    },
    {
      id: 3,
      name: "Mobile App v2",
      description: "React Native redesign",
      status: "active",
      performance: 6.8,
      engineers: 6,
      commits: 156,
    },
    {
      id: 4,
      name: "API Gateway",
      description: "Microservices infrastructure",
      status: "planning",
      performance: 5.5,
      engineers: 3,
      commits: 42,
    },
    {
      id: 5,
      name: "Payment Integration",
      description: "Stripe and PayPal support",
      status: "completed",
      performance: 9.1,
      engineers: 4,
      commits: 203,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="p-6 bg-card border-border hover:bg-card/80 transition-colors cursor-pointer h-full">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <Badge
                  variant={
                    project.status === "active" ? "default" : project.status === "completed" ? "secondary" : "outline"
                  }
                >
                  {project.status}
                </Badge>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Performance Score</span>
                  <span className={`text-2xl font-bold ${getPerformanceColor(project.performance)}`}>
                    {project.performance.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{project.engineers}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>{project.commits}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
