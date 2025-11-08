import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Target, TrendingUp, BookOpen, Award } from "lucide-react"

export function SBTRecommendations({ engineerId }: { engineerId: string }) {
  // Mock recommendations based on SBT analysis
  const recommendations = [
    {
      id: 1,
      title: "Improve System Architecture Skills",
      description: "Focus on distributed systems and microservices patterns",
      priority: "high",
      impact: "+8 points",
      estimatedTime: "40 hours",
      resources: ["AWS Architecture Course", "System Design Interview Guide"],
    },
    {
      id: 2,
      title: "Enhance Documentation Practices",
      description: "Strengthen technical writing and API documentation",
      priority: "medium",
      impact: "+5 points",
      estimatedTime: "20 hours",
      resources: ["Technical Writing Workshop", "Documentation Best Practices"],
    },
    {
      id: 3,
      title: "Expand Testing Coverage",
      description: "Learn advanced testing patterns and E2E testing",
      priority: "medium",
      impact: "+6 points",
      estimatedTime: "30 hours",
      resources: ["Testing Library Guide", "Playwright Workshop"],
    },
  ]

  const achievements = [
    {
      id: 1,
      title: "Code Quality Champion",
      description: "Maintained 95%+ code review score for 3 months",
      earned: "2 weeks ago",
      icon: Award,
    },
    {
      id: 2,
      title: "Fast Learner",
      description: "Completed 5 skill improvements in Q1",
      earned: "1 month ago",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Recommendations */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-6">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Growth Recommendations</h2>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                    <Badge variant={rec.priority === "high" ? "default" : "secondary"} className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Impact: </span>
                    <span className="text-success font-medium">{rec.impact}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span className="text-foreground">{rec.estimatedTime}</span>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Recommended Resources:</p>
                <div className="flex flex-wrap gap-2">
                  {rec.resources.map((resource) => (
                    <Badge key={resource} variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {resource}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full bg-transparent">
                Start Learning Path
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6">Recent Achievements</h2>
        <div className="space-y-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon
            return (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mb-1">{achievement.description}</p>
                  <p className="text-xs text-muted-foreground">Earned {achievement.earned}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
