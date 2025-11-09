import { NextRequest, NextResponse } from 'next/server';

import type { Engineer, Project, Prospect } from '@/lib/types';

const GEMINI_MODEL =
  process.env.STIRIXI_AI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY ||
  'AIzaSyAKcem8AOBySsGV-79qUFX2HRvQGlCzaxY';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

type StirixiAIInsights = {
  snapshot: {
    totalEngineers: number;
    avgPrs: number;
    avgBugs: number;
    avgTokenCost: number;
  };
  topEngineers: {
    name: string;
    title: string;
    prCount: number;
    bugCount: number;
    performance: number;
  }[];
  projectHealth: {
    title: string;
    importance: string;
    engineerCount: number;
    prospectCount: number;
  }[];
  pipeline: {
    name: string;
    title: string;
    performance: number;
    prCount: number;
  }[];
  contextBlock: string;
};

const SYSTEM_PROMPT = `
You are StirixiAI, the CTO copilot for the Stirixi engineering observability suite.
Operate like an executive partner:
- Turn data into crisp narratives (call out risk, velocity, hiring implications).
- Recommend next actions with owners, timelines, and metrics.
- When you need more detail, ask clarifying questions instead of guessing.
- Default to strategic language suited for a CTO, but cite concrete numbers pulled from the data snapshot you receive.
- Tie every answer back to engineering efficiency, delivery risk, or hiring signals.
If something is missing from the snapshot, acknowledge the gap and suggest how to capture it.
`;

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`StirixiAI data fetch error (${path}):`, error);
    return null;
  }
}

function toFixed(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

function deriveInsights(): StirixiAIInsights {
  return {
    snapshot: {
      totalEngineers: 0,
      avgPrs: 0,
      avgBugs: 0,
      avgTokenCost: 0,
    },
    topEngineers: [],
    projectHealth: [],
    pipeline: [],
    contextBlock:
      'No live data available. Focus on strategic questions or request a data refresh.',
  };
}

async function gatherInsights(): Promise<StirixiAIInsights> {
  const [engineersResp, projectsResp, prospectsResp] = await Promise.all([
    fetchJSON<Engineer[]>('/engineers/'),
    fetchJSON<Project[]>('/projects/'),
    fetchJSON<Prospect[]>('/prospects/'),
  ]);

  const engineers = engineersResp ?? [];
  const projects = projectsResp ?? [];
  const prospects = prospectsResp ?? [];

  if (
    engineers.length === 0 &&
    projects.length === 0 &&
    prospects.length === 0
  ) {
    return deriveInsights();
  }

  const snapshot = (() => {
    if (engineers.length === 0) {
      return {
        totalEngineers: 0,
        avgPrs: 0,
        avgBugs: 0,
        avgTokenCost: 0,
      };
    }
    const totals = engineers.reduce(
      (acc, eng) => {
        acc.prs += eng.pr_count ?? 0;
        acc.bugs += eng.bug_count ?? 0;
        acc.token += eng.token_cost ?? 0;
        return acc;
      },
      { prs: 0, bugs: 0, token: 0 }
    );
    return {
      totalEngineers: engineers.length,
      avgPrs: toFixed(totals.prs / engineers.length),
      avgBugs: toFixed(totals.bugs / engineers.length),
      avgTokenCost: toFixed(totals.token / engineers.length, 0),
    };
  })();

  const topEngineers = engineers
    .slice()
    .sort((a, b) => b.pr_count - a.pr_count)
    .slice(0, 5)
    .map((eng) => {
      const perf = eng.monthly_performance?.length
        ? eng.monthly_performance[eng.monthly_performance.length - 1]
        : 0;
      return {
        name: eng.name,
        title: eng.title,
        prCount: eng.pr_count,
        bugCount: eng.bug_count,
        performance: perf,
      };
    });

  const projectHealth = projects
    .slice()
    .sort((a, b) => (b.importance || '').localeCompare(a.importance || ''))
    .map((project) => ({
      title: project.title,
      importance: project.importance,
      engineerCount: project.engineers?.length ?? 0,
      prospectCount: project.prospects?.length ?? 0,
    }));

  const pipeline = prospects
    .slice()
    .sort((a, b) => (b.performance ?? 0) - (a.performance ?? 0))
    .slice(0, 5)
    .map((prospect) => ({
      name: prospect.name,
      title: prospect.title,
      performance: toFixed(prospect.performance ?? 0, 1),
      prCount: prospect.pr_count ?? 0,
    }));

  const contextLines = [
    `Org Snapshot: ${snapshot.totalEngineers} engineers | ${snapshot.avgPrs} avg PRs/mo | ${snapshot.avgBugs} avg bugs/mo | $${snapshot.avgTokenCost} avg AI spend`,
    topEngineers.length
      ? `Top Delivery ICs: ${topEngineers
          .map(
            (eng) =>
              `${eng.name} (${eng.prCount} PRs, ${eng.bugCount} bugs, perf ${eng.performance.toFixed(
                1
              )})`
          )
          .join(' • ')}`
      : 'No engineer delivery data available.',
    projectHealth.length
      ? `Project Coverage: ${projectHealth
          .slice(0, 4)
          .map(
            (proj) =>
              `${proj.title} (${proj.importance || 'n/a'}) - ${proj.engineerCount} eng, ${proj.prospectCount} candidates`
          )
          .join(' • ')}`
      : 'No project portfolio data available.',
    pipeline.length
      ? `Candidate Bench: ${pipeline
          .map(
            (prospect) =>
              `${prospect.name} (${prospect.performance} perf, ${prospect.prCount} PRs/mo)`
          )
          .join(' • ')}`
      : 'No candidate pipeline data available.',
  ];

  return {
    snapshot,
    topEngineers,
    projectHealth,
    pipeline,
    contextBlock: contextLines.join('\n'),
  };
}

function buildGeminiMessages(
  messages: ChatMessage[],
  contextBlock: string
): GeminiContent[] {
  const seed: GeminiContent = {
    role: 'user',
    parts: [{ text: `${SYSTEM_PROMPT.trim()}\n\nLive context:\n${contextBlock}` }],
  };

  const history = messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));

  return [seed, ...history];
}

async function callGemini(contents: GeminiContent[]) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.35,
          topK: 32,
          topP: 0.9,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini request failed (${response.status}): ${errorText}`
    );
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('\n')
      .trim() ?? 'I was unable to generate a response.';
  return text;
}

export async function GET() {
  const insights = await gatherInsights();
  return NextResponse.json({ insights });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = (body?.messages ?? []) as ChatMessage[];

  const insights = await gatherInsights();
  const contents = buildGeminiMessages(messages, insights.contextBlock);

  try {
    const reply = await callGemini(contents);
    return NextResponse.json({
      message: reply,
      insights,
    });
  } catch (error) {
    console.error('StirixiAI error:', error);
    return NextResponse.json(
      {
        message:
          'I hit an issue talking to Gemini. Please retry in a moment or verify the API key.',
        insights,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
