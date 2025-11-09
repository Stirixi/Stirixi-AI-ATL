import type { Metadata } from 'next';

import { AppHeader } from '@/components/app-header';
import { BackButton } from '@/components/back-button';
import { EngineerProfile } from '@/components/engineer-profile';
import { EngineerMetrics } from '@/components/engineer-metrics';
import { EngineerActivity } from '@/components/engineer-activity';
import { EngineerSBTPanel } from '@/components/engineer-sbt-panel';
import { engineerAPI } from '@/lib/api-client';
import type { Engineer } from '@/lib/types';

function getPerformanceColor(score: number): string {
  if (score >= 7.5) return '#22c55e'; // green
  if (score >= 5.0) return '#eab308'; // yellow
  return '#ef4444'; // red
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const engineer = (await engineerAPI.getById(id)) as Engineer;
    const latestScore = engineer.monthly_performance?.at(-1);
    const scoreLabel =
      typeof latestScore === 'number'
        ? ` • Score ${latestScore.toFixed(1)}`
        : '';
    return {
      title: `${engineer.name}${scoreLabel}`,
      description:
        engineer.title ||
        "Drill into an engineer's delivery metrics, AI usage, and on-chain credibility.",
    };
  } catch (error) {
    console.error('Engineer metadata lookup failed', error);
    return {
      title: 'Engineer Profile',
      description:
        "Drill into an engineer's delivery metrics, AI usage, and on-chain credibility.",
    };
  }
}

export default async function EngineerPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  let engineer: Engineer | null = null;
  try {
    engineer = (await engineerAPI.getById(id)) as Engineer;
  } catch (e) {
    console.error('Failed to fetch engineer', e);
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-6 py-8">
        <BackButton />
        <div className="space-y-6">
          {engineer ? (
            <>
              <EngineerProfile engineer={engineer} />
              <EngineerMetrics engineerId={id} engineer={engineer} />
              <EngineerSBTPanel engineerId={id} />
              <EngineerActivity engineerId={id} />
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              Engineer not found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
