import type { Metadata } from 'next';

import { AppHeader } from '@/components/app-header';
import { BackButton } from '@/components/back-button';
import { ProjectHeader } from '@/components/project-header';
import { ProjectMetrics } from '@/components/project-metrics';
import { ProjectTeam } from '@/components/project-team';
import { ProjectTimeline } from '@/components/project-timeline';
import { projectAPI } from '@/lib/api-client';
import type { Project } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const project = (await projectAPI.getById(id)) as Project;
    return {
      title: `${project.title} • Project Overview`,
      description:
        project.description ||
        'Review delivery metrics, roadmap, and staffing for this initiative.',
    };
  } catch (error) {
    console.error('Project metadata lookup failed', error);
    return {
      title: 'Project Overview',
      description:
        'Review delivery metrics, roadmap, and staffing for this initiative.',
    };
  }
}

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
