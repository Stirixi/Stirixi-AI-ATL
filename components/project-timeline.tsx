import { Card } from '@/components/ui/card';
import {
  GitCommit,
  GitPullRequest,
  GitMerge,
  CheckCircle2,
} from 'lucide-react';
import { actionAPI } from '@/lib/api-client';
import type { Action } from '@/lib/types';

// Map backend event strings to unified timeline types
function normalizeEvent(event: string): string {
  switch (event) {
    case 'merged_pr':
    case 'pr-merged':
      return 'pr-merged';
    case 'pr_open':
    case 'pr-open':
      return 'pr-open';
    case 'review':
      return 'review';
    case 'bug_fix':
      return 'bug-fix';
    case 'commit':
    default:
      return 'commit';
  }
}

function getIcon(type: string) {
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
}

function getColor(type: string) {
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
}

export async function ProjectTimeline({ projectId }: { projectId: string }) {
  let actions: Action[] = [];
  let error: string | null = null;

  try {
    // Use server-side filtering by passing projectId directly to the API
    actions = (await actionAPI.getAll({ projectId })) as Action[];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load actions';
    console.error('ProjectTimeline fetch error:', e);
  }

  return (
    <Card className="p-6 bg-card border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Project Timeline
      </h2>
      <div className="space-y-4">
        {actions.map((event, index) => {
          const type = normalizeEvent(event.event);
          return (
            <div key={event._id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center ${getColor(
                    type
                  )} shrink-0`}
                >
                  {getIcon(type)}
                </div>
                {index < actions.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-2" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {new Date(event.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  by {event.engineer}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {actions.length === 0 && (
          <div className="text-sm text-muted-foreground">
            {error ? (
              <p className="text-red-500">Error loading actions: {error}</p>
            ) : (
              <p>No recent activity for this project.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
