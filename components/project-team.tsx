import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { projectAPI, engineerAPI, prospectAPI } from '@/lib/api-client';
import type { Engineer, Prospect, Project } from '@/lib/types';

export async function ProjectTeam({ projectId }: { projectId: string }) {
  // fetch project, engineers, prospects
  const project = (await projectAPI.getById(projectId)) as Project;
  const engineers = (await engineerAPI.getAll()) as Engineer[];
  const prospects = (await prospectAPI.getAll()) as Prospect[];

  const team = engineers.filter((e) => project.engineers.includes(e._id));
  const goodFitProspects = prospects.filter((p) =>
    project.prospects.includes(p._id)
  );

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Team</h2>
            <Badge variant="secondary">{team.length} members</Badge>
          </div>

          <div className="space-y-3">
            {team.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No engineers assigned.
              </div>
            )}
            {team.map((member) => (
              <Link key={member._id} href={`/engineers/${member._id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {member.pr_count}
                    </p>
                    <p className="text-xs text-muted-foreground">PRs merged</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              Potential Candidates
            </h2>
            <Badge variant="outline">{goodFitProspects.length} matches</Badge>
          </div>

          <div className="space-y-3">
            {goodFitProspects.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No prospective matches.
              </div>
            )}
            {goodFitProspects.map((prospect) => (
              <Link key={prospect._id} href={`/prospective/${prospect._id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                      {prospect.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {prospect.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {prospect.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-500">
                      {prospect.performance}
                    </p>
                    <p className="text-xs text-muted-foreground">Performance Score</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
