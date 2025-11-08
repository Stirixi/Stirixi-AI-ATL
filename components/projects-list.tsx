import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Users } from 'lucide-react';
import Link from 'next/link';
import { projectAPI, engineerAPI } from '@/lib/api-client';
import type { Project, Engineer } from '@/lib/types';

function getPerformanceColor(score: number): string {
  if (score >= 7.5) return 'text-green-500';
  if (score >= 5.0) return 'text-yellow-500';
  return 'text-red-500';
}

export async function ProjectsList() {
  const projects = (await projectAPI.getAll()) as Project[];
  const engineers = (await engineerAPI.getAll()) as Engineer[];

  const items = projects.map((project) => {
    const team = engineers.filter((e) => project.engineers.includes(e._id));
    const engineerCount = team.length;
    const prTotal = team.reduce((sum, e) => sum + (e.pr_count || 0), 0);
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
    return { project, engineerCount, prTotal, performance };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.map(({ project, engineerCount, prTotal, performance }) => (
        <Link key={project._id} href={`/projects/${project._id}`}>
          <Card className="p-6 bg-card border-border hover:bg-card/80 transition-colors cursor-pointer h-full">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {project.description}
                  </p>
                </div>
                <Badge variant="outline">{project.importance}</Badge>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Performance Score
                  </span>
                  <span
                    className={`text-2xl font-bold ${getPerformanceColor(
                      performance
                    )}`}
                  >
                    {performance.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{engineerCount}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <GitBranch className="h-4 w-4" />
                  <span>{prTotal}</span>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
