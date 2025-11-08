import { AppHeader } from '@/components/app-header';
import { BackButton } from '@/components/back-button';
import { ProjectHeader } from '@/components/project-header';
import { ProjectMetrics } from '@/components/project-metrics';
import { ProjectTeam } from '@/components/project-team';
import { ProjectTimeline } from '@/components/project-timeline';

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <BackButton />
        <div className="space-y-6">
          <ProjectHeader projectId={id} />
          <ProjectMetrics projectId={id} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProjectTimeline projectId={id} />
            </div>
            <div>
              <ProjectTeam projectId={id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
