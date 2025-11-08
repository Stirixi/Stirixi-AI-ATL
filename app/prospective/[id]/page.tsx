import { AppHeader } from '@/components/app-header';
import { BackButton } from '@/components/back-button';
import { EngineerProfile } from '@/components/engineer-profile';
import { EngineerMetrics } from '@/components/engineer-metrics';
import { prospectAPI } from '@/lib/api-client';
import type { Prospect, Engineer } from '@/lib/types';

export default async function ProspectiveHirePage({
  params,
}: {
  params: { id: string };
}) {
  let prospect: Prospect | null = null;

  const { id } = await params;

  try {
    prospect = (await prospectAPI.getById(id)) as Prospect;
  } catch (error) {
    console.error('Failed to fetch prospect:', error);
  }

  if (!prospect) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            Prospect not found
          </div>
        </main>
      </div>
    );
  }

  // Convert Prospect to Engineer format for the profile component
  const engineerData: Engineer = {
    _id: prospect._id,
    name: prospect.name,
    title: prospect.title,
    skills: prospect.skills,
    email: prospect.email,
    github_user: prospect.github_user,
    date_hired: prospect.date_applied, // Use applied date as "hired" for prospects
    pr_count: prospect.pr_count,
    estimation_accuracy: prospect.estimation_accuracy,
    bug_count: prospect.bug_count,
    avg_review_time: prospect.avg_review_time,
    token_cost: prospect.token_cost,
    prompt_history: [],
    monthly_performance: [prospect.performance], // Use prospect's performance score
    recent_actions: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <BackButton />
        <div className="space-y-6">
          <EngineerProfile engineer={engineerData} isProspective />
          <EngineerMetrics
            engineerId={id}
            engineer={engineerData}
            isProspective
          />
        </div>
      </main>
    </div>
  );
}
