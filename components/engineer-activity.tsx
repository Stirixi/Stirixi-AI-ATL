import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitCommit, GitPullRequest, GitMerge, MessageSquare } from "lucide-react"

export function EngineerActivity({ engineerId }: { engineerId: string }) {
  // Mock data
  const activities = [
    {
      id: 1,
      type: "commit",
      title: "Implement user authentication flow",
      project: "Auth Service",
      time: "2 hours ago",
      details: "5 files changed, 234 additions, 89 deletions",
    },
    {
      id: 2,
      type: "pr",
      title: "Add Redis caching layer",
      project: "API Gateway",
      time: "5 hours ago",
      details: "Ready for review",
      status: "open",
    },
    {
      id: 3,
      type: "merge",
      title: "Update dependencies",
      project: "Mobile App",
      time: "1 day ago",
      details: "Merged to main",
    },
    {
      id: 4,
      type: "review",
      title: "Review: Database migration scripts",
      project: "Auth Service",
      time: "1 day ago",
      details: "Approved with comments",
    },
    {
      id: 5,
      type: "commit",
      title: "Fix memory leak in WebSocket handler",
      project: "Real-time Service",
      time: "2 days ago",
      details: "3 files changed, 45 additions, 67 deletions",
    },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4" />
      case "pr":
        return <GitPullRequest className="h-4 w-4" />
      case "merge":
        return <GitMerge className="h-4 w-4" />
      case "review":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                {activity.status && (
                  <Badge variant={activity.status === "open" ? "default" : "secondary"} className="text-xs">
                    {activity.status}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{activity.project}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{activity.time}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{activity.details}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
