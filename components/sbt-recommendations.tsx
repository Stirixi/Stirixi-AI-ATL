'use client';

import { Award, BookOpen, Target, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { EngineerScore } from '@/lib/types';

interface SBTRecommendationsProps {
  engineerId: string;
  score: EngineerScore | null;
  history: EngineerScore[];
  loading: boolean;
  error: string | null;
}

type Recommendation = {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  estimatedTime: string;
  resources: string[];
};

type Achievement = {
  id: string;
  title: string;
  description: string;
  earned: string;
  icon: typeof Award;
};

function percentify(value?: number | null): number {
  if (value == null) return 0;
  return value <= 1 ? Math.round(value * 100) : Math.round(value);
}

function deriveQualityScore(bugRate?: number | null): number {
  const percent = percentify(bugRate);
  return Math.max(0, 100 - percent);
}

function formatDate(value?: string) {
  if (!value) return 'recently';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatSignature(sig?: string | null) {
  if (!sig) return 'n/a';
  return `${sig.slice(0, 6)}…${sig.slice(-6)}`;
}

function buildRecommendations(score: EngineerScore | null): Recommendation[] {
  if (!score) {
    return [
      {
        id: 'baseline-ai',
        title: 'Calibrate AI workflows',
        description:
          'Capture baseline metrics and align prompts with team best practices.',
        priority: 'medium',
        impact: '+5 points',
        estimatedTime: '24 hours',
        resources: ['Prompt Library Review', 'AI Style Guide'],
      },
      {
        id: 'baseline-quality',
        title: 'Expand testing coverage',
        description:
          'Introduce integration tests for the most active services.',
        priority: 'medium',
        impact: '+4 points',
        estimatedTime: '32 hours',
        resources: ['Playwright Training', 'Testing Templates'],
      },
    ];
  }

  const recommendations: Recommendation[] = [];
  const aiScore = percentify(score.ai_efficiency_score);
  if (aiScore < 78) {
    recommendations.push({
      id: 'ai-efficiency',
      title: 'Optimize AI workflows',
      description:
        'Pair prompts with verified snippets to boost reuse and reduce token spend.',
      priority: 'high',
      impact: `+${Math.max(4, 80 - aiScore)} points`,
      estimatedTime: '30 hours',
      resources: ['Prompt Quality Checklist', 'Copilot Pairing Guide'],
    });
  }

  const reliability = percentify(score.reliability_score);
  if (reliability < 82) {
    recommendations.push({
      id: 'reliability',
      title: 'Strengthen reliability playbooks',
      description:
        'Shadow the incident commander rotation and document runbooks.',
      priority: 'medium',
      impact: `+${Math.max(3, 82 - reliability)} points`,
      estimatedTime: '20 hours',
      resources: ['On-call Ladder', 'SLI/SLO Templates'],
    });
  }

  const quality = deriveQualityScore(score.bug_rate);
  if (quality < 85) {
    recommendations.push({
      id: 'quality',
      title: 'Reduce escaped defects',
      description:
        'Add contract tests for high-churn services and pair reviews on risky PRs.',
      priority: 'high',
      impact: `+${Math.max(5, 90 - quality)} points`,
      estimatedTime: '36 hours',
      resources: ['Defect Playbook', 'Contract Testing Guide'],
    });
  }

  const confidence = percentify(score.confidence);
  if (confidence < 70) {
    recommendations.push({
      id: 'confidence',
      title: 'Refresh training data',
      description:
        'Feed recent sprint data into the ML pipeline to stabilize predictions.',
      priority: 'low',
      impact: '+3 points',
      estimatedTime: '16 hours',
      resources: ['ML Labeling SOP', 'Data Drift Checklist'],
    });
  }

  return recommendations.length > 0
    ? recommendations
    : [
        {
          id: 'growth',
          title: 'Stretch leadership initiative',
          description:
            'Lead a guild session on the latest automation improvements.',
          priority: 'medium',
          impact: '+4 points',
          estimatedTime: '18 hours',
          resources: ['Guild Facilitator Kit'],
        },
      ];
}

function buildAchievements(
  history: EngineerScore[],
  score: EngineerScore | null
): Achievement[] {
  const achievements: Achievement[] = [];
  if (score) {
    achievements.push({
      id: 'latest-proof',
      title: 'Latest on-chain proof',
      description: `Signature ${formatSignature(score.solana_signature)}`,
      earned: formatDate(score.last_updated),
      icon: Award,
    });
  }

  if (history.length > 1) {
    const recent = percentify(history[0].overall_score);
    const baseline = percentify(history[history.length - 1].overall_score);
    const delta = recent - baseline;
    if (Math.abs(delta) >= 3) {
      achievements.push({
        id: 'momentum',
        title: delta >= 0 ? 'Performance momentum' : 'Stability watch',
        description:
          delta >= 0
            ? `Up ${delta.toFixed(1)} pts across the last ${
                history.length
              } mints`
            : `Down ${Math.abs(delta).toFixed(
                1
              )} pts — flag for coaching follow-up`,
        earned: formatDate(history[history.length - 1].last_updated),
        icon: TrendingUp,
      });
    }
  }

  return achievements.length > 0
    ? achievements
    : [
        {
          id: 'readiness',
          title: 'Ready for first mint',
          description: 'Publish the inaugural SBT snapshot to enable tracking.',
          earned: 'pending',
          icon: Award,
        },
      ];
}

export function SBTRecommendations({
  engineerId,
  score,
  history,
  loading,
  error,
}: SBTRecommendationsProps) {
  const recommendations = buildRecommendations(score);
  const achievements = buildAchievements(history, score);

  if (loading && !score) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-card border-border space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-5 w-32" />
        </Card>
        <Card className="p-6 bg-card border-border space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-16 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-6">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Growth recommendations
          </h2>
        </div>

        {error && (
          <p className="text-xs text-destructive mb-4">
            Unable to refresh SBT data: {error}
          </p>
        )}

        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-lg bg-secondary/50 border border-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {rec.title}
                    </h3>
                    <Badge
                      variant={rec.priority === 'high' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rec.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3 text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-muted-foreground">Impact: </span>
                    <span className="text-success font-medium">
                      {rec.impact}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span className="text-foreground">{rec.estimatedTime}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  Engineer: {engineerId.slice(0, 6)}…
                </span>
              </div>

              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Recommended resources:
                </p>
                <div className="flex flex-wrap gap-2">
                  {rec.resources.map((resource) => (
                    <Badge key={resource} variant="outline" className="text-xs">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {resource}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button size="sm" variant="outline" className="w-full bg-transparent">
                Start learning path
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            On-chain achievements
          </h2>
        </div>
        <div className="space-y-3">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Logged {achievement.earned}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
