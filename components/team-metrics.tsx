import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

export function TeamMetrics() {
  const engineers = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Senior Engineer",
      prs: 12,
      performance: 8.7,
      status: "active",
    },
    {
      id: 2,
      name: "Marcus Johnson",
      role: "Tech Lead",
      prs: 15,
      performance: 8.2,
      status: "active",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Engineer",
      prs: 18,
      performance: 9.1,
      status: "active",
    },
    {
      id: 4,
      name: "Alex Kim",
      role: "Engineer",
      prs: 10,
      performance: 7.8,
      status: "active",
    },
    {
      id: 5,
      name: "Jordan Smith",
      role: "Senior Engineer",
      prs: 8,
      performance: 6.5,
      status: "away",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Team Performance</h2>
        <Badge variant="secondary">{engineers.length} Engineers</Badge>
      </div>

      <div className="space-y-4">
        {engineers.map((engineer) => (
          <Link key={engineer.id} href={`/engineers/${engineer.id}`}>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors cursor-pointer">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {engineer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">{engineer.name}</p>
                  <Badge variant={engineer.status === "active" ? "default" : "secondary"} className="text-xs">
                    {engineer.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{engineer.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-lg font-semibold text-foreground">{engineer.prs}</p>
                  <p className="text-xs text-muted-foreground">PRs</p>
                </div>
                <div>
                  <p className={`text-lg font-semibold ${getPerformanceColor(engineer.performance)}`}>
                    {engineer.performance.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Performance</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
