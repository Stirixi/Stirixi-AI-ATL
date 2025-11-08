import { Card } from "@/components/ui/card"
import { Bug, AlertCircle, TrendingUp } from "lucide-react"

function getPerformanceColor(score: number): string {
  if (score >= 7.5) {
    return "text-green-500"
  } else if (score >= 5.0) {
    return "text-yellow-500"
  } else {
    return "text-red-500"
  }
}

export function ProjectMetrics({ projectId }: { projectId: string }) {
  const metrics = {
    bugs: 7,
    importance: 8.5,
    performance: 8.4,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bug className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{metrics.bugs}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Bugs/Issues</p>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{metrics.importance.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground mt-1">Importance (1-10)</p>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <p className={`text-2xl font-bold ${getPerformanceColor(metrics.performance)}`}>
            {metrics.performance.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Performance Score</p>
        </div>
      </Card>
    </div>
  )
}
