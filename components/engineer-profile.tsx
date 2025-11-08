import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Github } from 'lucide-react';
import type { Engineer } from '@/lib/types';

export function EngineerProfile({
  engineer,
  isProspective = false,
}: {
  engineer: Engineer;
  isProspective?: boolean;
}) {
  // Map backend fields to UI-friendly display
  const display = {
    name: engineer.name,
    role: engineer.title,
    email: engineer.email,
    github: `@${engineer.github_user}`,
    status: 'active', // backend doesn't track status yet; default to active
    joinDate: new Date(engineer.date_hired).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
    }),
    skills: engineer.skills.filter(Boolean) as string[],
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24">
          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
            {display.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {display.name}
                </h1>
                <Badge
                  variant={
                    display.status === 'active' ? 'default' : 'secondary'
                  }
                >
                  {display.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{display.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{display.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Github className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{display.github}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">
                {isProspective ? '' : 'Joined: '}
              </span>
              <span className="text-foreground">{display.joinDate}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {display.skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
