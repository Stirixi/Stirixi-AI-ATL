import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GitCommit,
  GitPullRequest,
  GitMerge,
  CheckCircle2,
} from 'lucide-react';
import { actionAPI, engineerAPI, projectAPI } from '@/lib/api-client';
import type { Action, Engineer, Project } from '@/lib/types';

// Map backend event strings to unified timeline types
function normalizeEvent(event: string): string {
  switch (event) {
    case 'merged_pr':
    case 'pr-merged':
      return 'pr-merged';
    case 'pr_open':
    case 'pr-open':
    case 'pr_opened':
    case 'pr':
      return 'pr-open';
    case 'review':
      return 'review';
    case 'bug_fix':
      return 'bug-fix';
    case 'deployment':
    case 'incident':
    case 'commit':
    default:
      return 'commit';
  }
}

export async function EngineerActivity({ engineerId }: { engineerId: string }) {
  // Fetch real actions from MongoDB
  const allActions = (await actionAPI.getAll({ engineerId })) as Action[];

  // Fetch engineer to get their name
  const engineer = (await engineerAPI.getById(engineerId)) as Engineer;

  // Fetch all projects to map project IDs to names
  const projects = (await projectAPI.getAll()) as Project[];
  const projectMap = new Map(projects.map((p) => [p._id, p.title]));

  // Sort by date descending and take the most recent 10
  const activities = allActions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((action) => {
      // Calculate relative time
      const actionDate = new Date(action.date);
      const now = new Date();
      const diffMs = now.getTime() - actionDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = '';
      if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }

      return {
        id: action._id,
        type: normalizeEvent(action.event),
        title: action.title,
        project: projectMap.get(action.project || '') || 'Unknown Project',
        time: timeAgo,
        details: action.description,
        engineerName: engineer.name,
      };
    });

  const getIcon = (type: string) => {
    switch (type) {
      case 'pr-merged':
        return <GitMerge className="h-4 w-4" />;
      case 'pr-open':
        return <GitPullRequest className="h-4 w-4" />;
      case 'review':
        return <GitPullRequest className="h-4 w-4" />;
      case 'bug-fix':
        return <GitCommit className="h-4 w-4" />;
      case 'commit':
      default:
        return <GitCommit className="h-4 w-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'pr-merged':
        return 'text-success';
      case 'pr-open':
        return 'text-primary';
      case 'review':
        return 'text-warning';
      case 'bug-fix':
        return 'text-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Recent Activity
      </h2>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No recent activity found
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-4 p-4 rounded-lg bg-secondary/50 border border-border"
            >
              <div
                className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${getColor(
                  activity.type
                )}`}
              >
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {activity.project}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {activity.details}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
