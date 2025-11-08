import { Card } from "@/components/ui/card"
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

export function ProspectiveHires() {
  const prospects = [
    {
      id: 101,
      name: "David Park",
      role: "Senior Frontend Engineer",
      performance: 8.9,
      status: "Interview Scheduled",
      prsMerged: 15,
      appliedDate: "Jan 5, 2024",
    },
    {
      id: 102,
      name: "Lisa Martinez",
      role: "Full Stack Engineer",
      performance: 7.8,
      status: "Technical Review",
      prsMerged: 11,
      appliedDate: "Jan 8, 2024",
    },
    {
      id: 103,
      name: "James Wilson",
      role: "Backend Engineer",
      performance: 8.2,
      status: "Phone Screen",
      prsMerged: 13,
      appliedDate: "Jan 10, 2024",
    },
    {
      id: 104,
      name: "Nina Patel",
      role: "DevOps Engineer",
      performance: 7.5,
      status: "Applied",
      prsMerged: 9,
      appliedDate: "Jan 12, 2024",
    },
    {
      id: 105,
      name: "Robert Zhang",
      role: "Senior Backend Engineer",
      performance: 9.1,
      status: "Final Round",
      prsMerged: 18,
      appliedDate: "Jan 3, 2024",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prospects.map((prospect) => (
        <Link key={prospect.id} href={`/prospective/${prospect.id}`}>
          <Card className="p-6 bg-secondary/50 border-border hover:bg-secondary/70 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {prospect.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{prospect.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{prospect.role}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/30 border border-border mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Performance Score</span>
                <span className={`text-2xl font-bold ${getPerformanceColor(prospect.performance)}`}>
                  {prospect.performance.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">{prospect.status}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">PRs Merged</span>
                <span className="text-foreground font-medium">{prospect.prsMerged}/month</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Applied</span>
                <span className="text-foreground">{prospect.appliedDate}</span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
