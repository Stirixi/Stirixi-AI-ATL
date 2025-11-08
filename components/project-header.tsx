import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { engineerAPI, projectAPI } from '@/lib/api-client';
import type { Engineer, Project } from '@/lib/types';

function getPerformanceColor(score: number): string {
  if (score >= 7.5) return 'text-green-500';
  if (score >= 5.0) return 'text-yellow-500';
  return 'text-red-500';
}

export async function ProjectHeader({ projectId }: { projectId: string }) {
  const project = (await projectAPI.getById(projectId)) as Project;
  const engineers = (await engineerAPI.getAll()) as Engineer[];
  const team = engineers.filter((e) => project.engineers.includes(e._id));
  const perfValues = team
    .map((e) =>
      e.monthly_performance && e.monthly_performance.length
        ? e.monthly_performance.at(-1)!
        : null
    )
    .filter((v): v is number => v !== null);
  const performance = perfValues.length
    ? perfValues.reduce((a, b) => a + b, 0) / perfValues.length
    : 0;

  const start = project.start_date ? new Date(project.start_date) : null;
  const target = project.target_date ? new Date(project.target_date) : null;
  const fmt = (d: Date | null) =>
    d
      ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
      : '-';

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              {project.title}
            </h1>
            <Badge variant="outline">{project.importance}</Badge>
          </div>
          <p className="text-muted-foreground mb-4">{project.description}</p>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Started: </span>
              <span className="text-foreground">{fmt(start)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Target: </span>
              <span className="text-foreground">{fmt(target)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-secondary/30 border border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Overall Performance
          </span>
          <span
            className={`text-3xl font-bold ${getPerformanceColor(performance)}`}
          >
            {performance.toFixed(1)}
          </span>
        </div>
      </div>
    </Card>
  );
}
