'use client';

import { Card } from '@/components/ui/card';
import {
  GitPullRequest,
  Calendar,
  Bug,
  Clock,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Engineer, Prompt } from '@/lib/types';
import { promptAPI, engineerAPI } from '@/lib/api-client';

function getPerformanceColor(score: number): string {
  if (score >= 7.5) {
    return 'text-green-500';
  } else if (score >= 5.0) {
    return 'text-yellow-500';
  } else {
    return 'text-red-500';
  }
}

export function EngineerMetrics({
  engineerId,
  isProspective = false,
  engineer,
}: {
  engineerId: string;
  isProspective?: boolean;
  engineer?: Engineer;
}) {
  const [promptHistoryOpen, setPromptHistoryOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [allEngineers, setAllEngineers] = useState<Engineer[]>([]);

  useEffect(() => {
    if (!isProspective && engineerId) {
      setLoadingPrompts(true);
      promptAPI
        .getAll(engineerId)
        .then((data: any) => {
          setPrompts(data as Prompt[]);
        })
        .catch((e) => setPromptError(e.message))
        .finally(() => setLoadingPrompts(false));
    }
  }, [engineerId, isProspective]);

  // Fetch all engineers for company averages
  useEffect(() => {
    if (!isProspective) {
      engineerAPI
        .getAll()
        .then((data: any) => {
          setAllEngineers(data as Engineer[]);
        })
        .catch((e) => console.error('Failed to fetch engineers:', e));
    }
  }, [isProspective]);

  // Derive metrics from engineer object or fallback
  const lastPerformance = engineer?.monthly_performance?.length
    ? engineer.monthly_performance[engineer.monthly_performance.length - 1]
    : 0;

  // Calculate company averages from all engineers
  const companyAvgMetrics =
    allEngineers.length > 0
      ? {
          prsMerged: Math.round(
            allEngineers.reduce((sum, e) => sum + e.pr_count, 0) /
              allEngineers.length
          ),
          estimationAccuracy: (() => {
            const validAccuracies = allEngineers.filter(
              (e) => e.estimation_accuracy != null
            );
            if (validAccuracies.length === 0) return 0;
            return (
              validAccuracies.reduce(
                (sum, e) => sum + (e.estimation_accuracy || 0),
                0
              ) / validAccuracies.length
            );
          })(),
          bugsGenerated: Math.round(
            allEngineers.reduce((sum, e) => sum + e.bug_count, 0) /
              allEngineers.length
          ),
          avgReviewTime: (() => {
            const validReviewTimes = allEngineers.filter(
              (e) => e.avg_review_time != null
            );
            if (validReviewTimes.length === 0) return '—';
            const avg =
              validReviewTimes.reduce(
                (sum, e) => sum + (e.avg_review_time || 0),
                0
              ) / validReviewTimes.length;
            return `${avg.toFixed(1)}h`;
          })(),
          aiSpend:
            allEngineers.reduce((sum, e) => sum + e.token_cost, 0) /
            allEngineers.length,
          performance: (() => {
            const engineersWithPerformance = allEngineers.filter(
              (e) => e.monthly_performance?.length > 0
            );
            if (engineersWithPerformance.length === 0) return 0;
            const performances = engineersWithPerformance.map(
              (e) => e.monthly_performance[e.monthly_performance.length - 1]
            );
            return (
              performances.reduce((sum, p) => sum + p, 0) / performances.length
            );
          })(),
        }
      : {
          prsMerged: 0,
          estimationAccuracy: 0,
          bugsGenerated: 0,
          avgReviewTime: '—',
          aiSpend: 0,
          performance: 0,
        };

  const metrics = {
    engineer: {
      prsMerged: engineer?.pr_count ?? 0,
      estimationAccuracy: engineer?.estimation_accuracy ?? null,
      bugsGenerated: engineer?.bug_count ?? 0,
      avgReviewTime:
        engineer?.avg_review_time != null
          ? `${engineer.avg_review_time.toFixed(1)}h`
          : '—',
      aiSpend: engineer?.token_cost ?? 0,
      performance: lastPerformance,
    },
    companyAvg: companyAvgMetrics,
  };

  // Build a performance history from monthly_performance (limit to last 6)
  const engineerHistory = (engineer?.monthly_performance || []).slice(-6);

  // Calculate company average for each month position
  const companyHistoryByMonth = engineerHistory.map((_, idx) => {
    // For each month position, calculate average across all engineers
    const engineersWithDataAtPosition = allEngineers.filter(
      (e) => e.monthly_performance && e.monthly_performance.length > idx
    );

    if (engineersWithDataAtPosition.length === 0) return 0;

    const sumAtPosition = engineersWithDataAtPosition.reduce(
      (sum, e) =>
        sum +
        (e.monthly_performance[
          e.monthly_performance.length - engineerHistory.length + idx
        ] || 0),
      0
    );

    const average = sumAtPosition / engineersWithDataAtPosition.length;
    return Math.round(average * 10) / 10; // Round to 1 decimal place
  });

  const performanceHistory = engineerHistory.map(
    (score: number, idx: number) => {
      // Generate month labels relative to current month going backwards
      const monthDate = new Date();
      monthDate.setMonth(
        monthDate.getMonth() - (engineerHistory.length - 1 - idx)
      );
      return {
        month: monthDate.toLocaleString(undefined, { month: 'short' }),
        engineer: score,
        company: companyHistoryByMonth[idx],
      };
    }
  );

  const promptHistory = prompts.map((p) => {
    const d = new Date(p.date);
    return {
      date: d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      time: d.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
      prompt: p.text,
      tokens: p.tokens,
      model: p.model,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitPullRequest className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {metrics.engineer.prsMerged}
              </p>
              <p className="text-sm text-muted-foreground">
                PRs Merged (Monthly)
              </p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{' '}
              <span className="text-foreground">
                {metrics.companyAvg.prsMerged}
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {metrics.engineer.estimationAccuracy != null
                  ? `${
                      metrics.engineer.estimationAccuracy > 0 ? '+' : ''
                    }${metrics.engineer.estimationAccuracy.toFixed(1)}d`
                  : '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                Estimation Accuracy
              </p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{' '}
              <span className="text-foreground">
                {metrics.companyAvg.estimationAccuracy > 0 ? '+' : ''}
                {metrics.companyAvg.estimationAccuracy.toFixed(1)}d
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bug className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {metrics.engineer.bugsGenerated}
              </p>
              <p className="text-sm text-muted-foreground">Bugs Generated</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{' '}
              <span className="text-foreground">
                {metrics.companyAvg.bugsGenerated}
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                {metrics.engineer.avgReviewTime}
              </p>
              <p className="text-sm text-muted-foreground">Avg Review Time</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{' '}
              <span className="text-foreground">
                {metrics.companyAvg.avgReviewTime}
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">
                ${metrics.engineer.aiSpend.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                AI Spend (Monthly)
              </p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{' '}
              <span className="text-foreground">
                ${metrics.companyAvg.aiSpend.toFixed(2)}
              </span>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p
                className={`text-2xl font-bold ${getPerformanceColor(
                  metrics.engineer.performance
                )}`}
              >
                {metrics.engineer.performance.toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Performance Score</p>
            </div>
          </div>
          {!isProspective && (
            <div className="text-xs text-muted-foreground">
              Company Avg:{' '}
              <span className="text-foreground">
                {metrics.companyAvg.performance.toFixed(1)}
              </span>
            </div>
          )}
        </Card>
      </div>

      {!isProspective && (
        <Card className="p-6 bg-card border-border">
          <Collapsible
            open={promptHistoryOpen}
            onOpenChange={setPromptHistoryOpen}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-2xl font-bold text-foreground">
                    {promptHistory.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Prompt History
                  </p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    promptHistoryOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {promptHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-sm p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        {item.date} at {item.time}
                      </p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {item.model}
                      </span>
                    </div>
                    <p className="text-foreground leading-relaxed mb-2">
                      {item.prompt}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {!isProspective && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Monthly Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={performanceHistory}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                stroke="#ffffff"
                tick={{ fill: '#ffffff' }}
              />
              <YAxis
                domain={[0, 10]}
                stroke="#ffffff"
                tick={{ fill: '#ffffff' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="engineer"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Performance"
              />
              <Line
                type="monotone"
                dataKey="company"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Company Average"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
