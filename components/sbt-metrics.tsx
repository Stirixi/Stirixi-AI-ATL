'use client';

import { Activity, Brain, Bug, ShieldCheck, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { EngineerScore } from '@/lib/types';

interface SBTMetricsProps {
  score: EngineerScore | null;
  history: EngineerScore[];
  loading: boolean;
  error: string | null;
}

const CATEGORY_CONFIG = [
  {
    key: 'reliability_score',
    name: 'Reliability',
    description: 'On-call readiness, incident response, and SLA adherence.',
    icon: ShieldCheck,
  },
  {
    key: 'ai_efficiency_score',
    name: 'AI Efficiency',
    description: 'Throughput improvements driven by AI tooling.',
    icon: Zap,
  },
  {
    key: 'quality',
    name: 'Quality',
    description: 'Bug density, regression rates, and review hygiene.',
    icon: Bug,
  },
  {
    key: 'confidence',
    name: 'Confidence',
    description: 'Model certainty in the latest ML snapshot.',
    icon: Activity,
  },
] as const;

function percentify(value?: number | null): number {
  if (value == null) return 0;
  if (value <= 1) {
    return Math.round(value * 100);
  }
  return Math.round(value);
}

function deriveQualityScore(bugRate?: number | null): number {
  const percent = percentify(bugRate);
  return Math.max(0, 100 - percent);
}

function getLevelMeta(score: number) {
  const tiers = [
    { min: 0, max: 55, level: 'Emerging', next: 'Intermediate' },
    { min: 55, max: 70, level: 'Intermediate', next: 'Advanced' },
    { min: 70, max: 85, level: 'Advanced', next: 'Expert' },
    { min: 85, max: 100, level: 'Expert', next: 'Expert' },
  ];
  const clamped = Math.max(0, Math.min(100, score));
  const tier = tiers.find((t) => clamped < t.max) ?? tiers[tiers.length - 1];
  const progress =
    tier.max === tier.min
      ? 100
      : Math.round(((clamped - tier.min) / (tier.max - tier.min)) * 100);
  return {
    level: tier.level,
    nextMilestone: tier.next,
    progress: Math.max(0, Math.min(100, progress)),
  };
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSignature(sig?: string | null) {
  if (!sig) return 'n/a';
  return `${sig.slice(0, 6)}…${sig.slice(-6)}`;
}

export function SBTMetrics({
  score,
  history,
  loading,
  error,
}: SBTMetricsProps) {
  if (loading && !score) {
    return (
      <Card className="p-6 bg-card border-border space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-48 w-full" />
      </Card>
    );
  }

  if (!score) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            No SBT snapshots yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Mint a score to generate the first on-chain proof for this engineer.
          </p>
          {error && (
            <p className="text-xs text-destructive">Last attempt failed: {error}</p>
          )}
        </div>
      </Card>
    );
  }

  const overall = percentify(score.overall_score);
  const meta = getLevelMeta(overall);
  const previousEntry = history.length > 1 ? history[1] : null;
  const previousOverall = previousEntry
    ? percentify(previousEntry.overall_score)
    : null;
  const overallDelta =
    previousOverall != null ? overall - previousOverall : null;

  const categories = CATEGORY_CONFIG.map((category) => {
    if (category.key === 'quality') {
      const current = deriveQualityScore(score.bug_rate);
      const previous = previousEntry
        ? deriveQualityScore(previousEntry.bug_rate)
        : null;
      return {
        ...category,
        score: current,
        previous,
        change: previous != null ? current - previous : null,
      };
    }

    if (category.key === 'confidence') {
      const current = percentify(score.confidence);
      const previous = previousEntry
        ? percentify(previousEntry.confidence)
        : null;
      return {
        ...category,
        score: current,
        previous,
        change: previous != null ? current - previous : null,
      };
    }

    const key = category.key as 'reliability_score' | 'ai_efficiency_score';
    const current = percentify(score[key]);
    const previous = previousEntry ? percentify(previousEntry[key]) : null;
    return {
      ...category,
      score: current,
      previous,
      change: previous != null ? current - previous : null,
    };
  });

  const historyList =
    history.length > 0
      ? history
          .slice(0, 5)
          .map((entry) => ({
            id: entry._id,
            issuedAt: formatDate(entry.last_updated),
            overall: percentify(entry.overall_score),
            signature: formatSignature(entry.solana_signature),
            hash: formatSignature(entry.score_hash ?? undefined),
          }))
      : [];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall SBT Score</p>
              <p className="text-3xl font-bold text-foreground">{overall}</p>
            </div>
          </div>
          <Badge variant="default">{meta.level}</Badge>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress to {meta.nextMilestone}
            </span>
            <span className="text-foreground font-medium">
              {meta.progress}%
            </span>
          </div>
          <Progress value={meta.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Wallet</p>
            <p className="font-medium text-foreground">
              {formatSignature(score.engineer_wallet)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Signature</p>
            <p className="font-medium text-foreground">
              {formatSignature(score.solana_signature)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Change</p>
            <p className="font-medium text-foreground">
              {overallDelta != null
                ? `${overallDelta >= 0 ? '+' : ''}${overallDelta.toFixed(1)}`
                : '—'}
            </p>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive mt-4">
            Latest fetch warning: {error}
          </p>
        )}
      </Card>

      <Tabs defaultValue="reliability" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger
              key={category.key as string}
              value={category.key as string}
            >
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent
            key={category.key as string}
            value={category.key as string}
            className="mt-4"
          >
            <Card className="p-5 bg-card border-border space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-foreground">
                    {category.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {category.score.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">Current score</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-secondary/40">
                  <p className="text-muted-foreground">Prev.</p>
                  <p className="text-foreground font-semibold">
                    {category.previous != null
                      ? category.previous.toFixed(1)
                      : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40">
                  <p className="text-muted-foreground">Change</p>
                  <p className="text-foreground font-semibold">
                    {category.change != null
                      ? `${category.change >= 0 ? '+' : ''}${category.change.toFixed(
                          1
                        )}`
                      : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/40">
                  <p className="text-muted-foreground">Last mint</p>
                  <p className="text-foreground font-semibold">
                    {formatDate(score.last_updated)}
                  </p>
                </div>
              </div>

              <Progress value={category.score} className="h-2" />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              On-chain history
            </h3>
            <p className="text-sm text-muted-foreground">
              Recent Token-2022 non-transferable mints
            </p>
          </div>
          <Badge variant="secondary">{historyList.length} proofs</Badge>
        </div>
        {historyList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No on-chain proofs recorded yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {historyList.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-lg bg-secondary/40 border border-border text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-foreground font-medium">
                    {entry.overall}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {entry.issuedAt}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Signature: {entry.signature}</span>
                  <span>Hash: {entry.hash}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
