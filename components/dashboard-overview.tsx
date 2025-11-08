import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Activity, Users, GitBranch } from 'lucide-react';
import { engineerAPI, projectAPI } from '@/lib/api-client';
import type { Engineer, Project } from '@/lib/types';

export async function DashboardOverview() {
  // Fetch real data from MongoDB
  const engineers = (await engineerAPI.getAll()) as Engineer[];
  const projects = (await projectAPI.getAll()) as Project[];

  // Calculate overall performance from engineers with performance data
  const engineersWithPerformance = engineers.filter(
    (e) => e.monthly_performance && e.monthly_performance.length > 0
  );
  const avgPerformance =
    engineersWithPerformance.length > 0
      ? engineersWithPerformance.reduce(
          (sum, e) =>
            sum + e.monthly_performance[e.monthly_performance.length - 1],
          0
        ) / engineersWithPerformance.length
      : 0;

  const metrics = [
    {
      label: 'Active Engineers',
      value: engineers.length.toString(),
      change: '+2',
      trend: 'up',
      icon: Users,
    },
    {
      label: 'Active Projects',
      value: projects.length.toString(),
      change: '+3',
      trend: 'up',
      icon: GitBranch,
    },
    {
      label: 'Average Performance',
      value: avgPerformance.toFixed(1),
      change: '+5%',
      trend: 'up',
      icon: Activity,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const isPositive = metric.trend === 'up';
        const TrendIcon = isPositive ? ArrowUp : ArrowDown;

        return (
          <Card key={metric.label} className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                <TrendIcon className="h-4 w-4" />
                <span>{metric.change}</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {metric.label}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
