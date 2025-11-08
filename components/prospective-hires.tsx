import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { prospectAPI } from '@/lib/api-client';
import type { Prospect } from '@/lib/types';

function getPerformanceColor(score: number): string {
  if (score >= 7.5) {
    return 'text-green-500';
  } else if (score >= 5.0) {
    return 'text-yellow-500';
  } else {
    return 'text-red-500';
  }
}

export async function ProspectiveHires() {
  const prospects = (await prospectAPI.getAll()) as Prospect[];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prospects.map((prospect) => {
        const appliedDate = new Date(prospect.date_applied).toLocaleDateString(
          undefined,
          {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }
        );

        return (
          <Link key={prospect._id} href={`/prospective/${prospect._id}`}>
            <Card className="p-6 bg-secondary/50 border-border hover:bg-secondary/70 transition-colors cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {prospect.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {prospect.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {prospect.title}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30 border border-border mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Performance Score
                  </span>
                  <span
                    className={`text-2xl font-bold ${getPerformanceColor(
                      prospect.performance
                    )}`}
                  >
                    {prospect.performance.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">PRs Merged</span>
                  <span className="text-foreground font-medium">
                    {prospect.pr_count}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bugs Generated</span>
                  <span className="text-foreground font-medium">
                    {prospect.bug_count}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Applied</span>
                  <span className="text-foreground">{appliedDate}</span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
