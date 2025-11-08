import { Card } from '@/components/ui/card';
import { Bug, AlertCircle, TrendingUp } from 'lucide-react';
import { engineerAPI, projectAPI } from '@/lib/api-client';
import type { Engineer, Project } from '@/lib/types';

function getPerformanceColor(score: number): string {
  if (score >= 7.5) return 'text-green-500';
  if (score >= 5.0) return 'text-yellow-500';
  return 'text-red-500';
}

export async function ProjectMetrics({ projectId }: { projectId: string }) {
  const project = (await projectAPI.getById(projectId)) as Project;
  const engineers = (await engineerAPI.getAll()) as Engineer[];
  const team = engineers.filter((e) => project.engineers.includes(e._id));

  const bugs = team.reduce((sum, e) => sum + (e.bug_count || 0), 0);
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bug className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{bugs}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Total Bugs/Issues
          </p>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground capitalize">
            {project.importance}
          </p>
          <p className="text-sm text-muted-foreground mt-1">Importance</p>
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div>
          <p
            className={`text-2xl font-bold ${getPerformanceColor(performance)}`}
          >
            {performance.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Performance Score
          </p>
        </div>
      </Card>
    </div>
  );
}
