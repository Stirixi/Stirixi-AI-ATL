'use client';

import { useEffect, useState } from 'react';

import { SBTMetrics } from '@/components/sbt-metrics';
import { SBTRecommendations } from '@/components/sbt-recommendations';
import { engineerAPI } from '@/lib/api-client';
import { getMockSBTSeries } from '@/lib/mock-sbt';
import type { EngineerScore } from '@/lib/types';

interface EngineerSBTPanelProps {
  engineerId: string;
  useMockOnly?: boolean;
}

export function EngineerSBTPanel({
  engineerId,
  useMockOnly = false,
}: EngineerSBTPanelProps) {
  const [latestScore, setLatestScore] = useState<EngineerScore | null>(null);
  const [history, setHistory] = useState<EngineerScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!engineerId) return;
    let cancelled = false;

    const hydrateFromMock = () => {
      if (cancelled) return;
      const mockData = getMockSBTSeries(engineerId);
      setLatestScore(mockData.latest);
      setHistory(mockData.history);
    };

    async function fetchScores() {
      setLoading(true);
      setError(null);
      try {
        const [latest, historyResponse] = await Promise.all([
          engineerAPI.getLatestScore(engineerId),
          engineerAPI.getScores(engineerId, 5),
        ]);

        if (cancelled) return;

        const historyList = Array.isArray(historyResponse)
          ? (historyResponse as EngineerScore[])
          : [];

        const latestScoreData = (latest as EngineerScore | null) ?? null;

        if (!latestScoreData) {
          hydrateFromMock();
          return;
        }

        const normalizedHistory = [
          latestScoreData,
          ...historyList.filter((entry) => entry._id !== latestScoreData._id),
        ];

        setLatestScore(latestScoreData);
        setHistory(normalizedHistory);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load on-chain SBT data'
        );
        hydrateFromMock();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (useMockOnly) {
      setLoading(true);
      setError(null);
      hydrateFromMock();
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    fetchScores();
    return () => {
      cancelled = true;
    };
  }, [engineerId, useMockOnly]);

  if (!engineerId) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SBTMetrics
        score={latestScore}
        history={history}
        loading={loading}
        error={error}
      />
      <SBTRecommendations
        engineerId={engineerId}
        score={latestScore}
        history={history}
        loading={loading}
        error={error}
      />
    </div>
  );
}
