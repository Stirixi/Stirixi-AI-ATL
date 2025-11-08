import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function ProjectTeam({ projectId }: { projectId: string }) {
  // Mock data
  const team = [
    {
      id: 1,
      name: 'Sarah Chen',
      role: 'Tech Lead',
      prsMerged: 24,
      status: 'active',
    },
    {
      id: 2,
      name: 'Marcus Johnson',
      role: 'Backend',
      prsMerged: 19,
      status: 'active',
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      role: 'Frontend',
      prsMerged: 27,
      status: 'active',
    },
    {
      id: 4,
      name: 'Alex Kim',
      role: 'DevOps',
      prsMerged: 11,
      status: 'active',
    },
    {
      id: 5,
      name: 'Jordan Smith',
      role: 'QA Engineer',
      prsMerged: 7,
      status: 'active',
    },
  ];

  const goodFitProspects = [
    {
      id: 101,
      name: 'David Park',
      role: 'Senior Frontend Engineer',
      performance: 8.9,
      fitReason: 'Strong React & TypeScript skills',
    },
    {
      id: 105,
      name: 'Robert Zhang',
      role: 'Senior Backend Engineer',
      performance: 9.1,
      fitReason: 'OAuth expertise',
    },
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Team</h2>
            <Badge variant="secondary">{team.length} members</Badge>
          </div>

          <div className="space-y-3">
            {team.map((member) => (
              <Link key={member.id} href={`/engineers/${member.id}`}>
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
                      {member.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {member.prsMerged}
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
            {goodFitProspects.map((prospect) => (
              <Link key={prospect.id} href={`/prospective/${prospect.id}`}>
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
                      {prospect.fitReason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-500">
                      {prospect.performance.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">score</p>
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
