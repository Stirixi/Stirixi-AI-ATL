import type { Metadata } from 'next';

import { AppHeader } from '@/components/app-header';
import { DashboardOverview } from '@/components/dashboard-overview';
import { DashboardTabs } from '@/components/dashboard-tabs';
import { TeamView } from '@/components/team-view';
import { ProjectsList } from '@/components/projects-list';
import { ProspectiveHires } from '@/components/prospective-hires';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Executive Dashboard',
  description:
    'Track engineering throughput, project health, and hiring funnels in one Stirixi cockpit.',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  if (!user) {
    redirect('/login?next=/dashboard');
  }

  // Pre-render the async server components
  const teamView = <TeamView />;
  const projectsList = <ProjectsList />;
  const prospectiveHires = <ProspectiveHires />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Track your engineering metrics and team performance
            </p>
          </div>

          <DashboardOverview />

          <DashboardTabs
            defaultTab={params.tab}
            teamView={teamView}
            projectsList={projectsList}
            prospectiveHires={prospectiveHires}
          />
        </div>
      </main>
    </div>
  );
}
