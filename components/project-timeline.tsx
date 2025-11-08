import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitCommit, GitPullRequest, GitMerge, CheckCircle2 } from "lucide-react"

export function ProjectTimeline({ projectId }: { projectId: string }) {
  // Mock data
  const events = [
    {
      id: 1,
      type: "pr-merged",
      title: "Implement OAuth2 token refresh",
      author: "Sarah Chen",
      time: "3 hours ago",
      details: "PR #45 merged to main",
    },
    {
      id: 2,
      type: "pr-open",
      title: "Add SSO integration tests",
      author: "Marcus Johnson",
      time: "5 hours ago",
      details: "PR #46 ready for review",
      reviewers: 2,
    },
    {
      id: 3,
      type: "commit",
      title: "Update authentication middleware",
      author: "Emma Rodriguez",
      time: "8 hours ago",
      details: "7 files changed",
    },
    {
      id: 4,
      type: "milestone",
      title: "Beta Release Complete",
      time: "1 day ago",
      details: "All features implemented",
    },
    {
      id: 5,
      type: "pr-merged",
      title: "Fix session timeout bug",
      author: "Alex Kim",
      time: "2 days ago",
      details: "PR #43 merged to main",
    },
    {
      id: 6,
      type: "commit",
      title: "Add user session management",
      author: "Sarah Chen",
      time: "2 days ago",
      details: "4 files changed",
    },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "pr-merged":
        return <GitMerge className="h-4 w-4" />
      case "pr-open":
        return <GitPullRequest className="h-4 w-4" />
      case "commit":
        return <GitCommit className="h-4 w-4" />
      case "milestone":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case "pr-merged":
        return "text-success"
      case "pr-open":
        return "text-primary"
      case "milestone":
        return "text-warning"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">Project Timeline</h2>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ${getColor(event.type)} flex-shrink-0`}
              >
                {getIcon(event.type)}
              </div>
              {index < events.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{event.time}</span>
              </div>
              {event.author && <p className="text-xs text-muted-foreground mb-1">by {event.author}</p>}
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{event.details}</p>
                {event.reviewers && (
                  <Badge variant="outline" className="text-xs">
                    {event.reviewers} reviewers
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
