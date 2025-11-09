import { NextRequest, NextResponse } from 'next/server';

import type { Engineer, Project, Prospect } from '@/lib/types';

const GEMINI_MODEL =
  process.env.STIRIXI_AI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_STREAM_TIMEOUT_MS = Number(
  process.env.GEMINI_STREAM_TIMEOUT_MS || 45000
);
const API_BASE_URL =
  process.env.NEXT_SERVER_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';
const INSIGHTS_CACHE_TTL_MS = Number(
  process.env.STIRIXI_INSIGHTS_TTL_MS || 30_000
);

type CachedInsights = {
  data: StirixiAIInsights;
  expiresAt: number;
};

let cachedInsights: CachedInsights | null = null;

const log = (...parts: unknown[]) =>
  console.log('[StirixiAI]', ...parts);

type Prompt = {
  _id: string;
  model: string;
  date: string;
  tokens: number;
  text: string;
  engineer: string;
};

type Action = {
  _id: string;
  engineer?: string;
  project?: string;
  action_type: string;
  description: string;
  date: string;
};

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
  const now = Date.now();
  if (cachedInsights && cachedInsights.expiresAt > now) {
    log('Using cached insights snapshot');
    return cachedInsights.data;
  }

  log('Fetching fresh insights snapshot');
  const start = performance.now();

  const [engineersResp, projectsResp, prospectsResp, promptsResp, actionsResp] = await Promise.all([
    fetchJSON<Engineer[]>('/engineers/'),
    fetchJSON<Project[]>('/projects/'),
    fetchJSON<Prospect[]>('/prospects/'),
    fetchJSON<Prompt[]>('/prompts/'),
    fetchJSON<Action[]>('/actions/'),
  ]);

  const engineers = engineersResp ?? [];
  const projects = projectsResp ?? [];
  const prospects = prospectsResp ?? [];
  const prompts = promptsResp ?? [];
  const actions = actionsResp ?? [];

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

  // Add AI usage insights from prompts
  const aiUsageStats = prompts.length > 0 ? (() => {
    const totalTokens = prompts.reduce((sum, p) => sum + (p.tokens || 0), 0);
    const recentPrompts = prompts.slice(0, 10);
    const avgTokensPerPrompt = prompts.length > 0 ? totalTokens / prompts.length : 0;
    return `AI Usage: ${prompts.length} prompts total | ${totalTokens.toLocaleString()} tokens | ${avgTokensPerPrompt.toFixed(0)} avg tokens/prompt | Recent: ${recentPrompts.length} prompts`;
  })() : 'No AI usage data available.';

  // Add recent actions context
  const recentActions = actions.length > 0 ? (() => {
    const actionsByType = actions.slice(0, 20).reduce((acc, action) => {
      acc[action.action_type] = (acc[action.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const actionSummary = Object.entries(actionsByType)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');
    return `Recent Activity (last 20): ${actionSummary}`;
  })() : 'No recent activity data available.';

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
    aiUsageStats,
    recentActions,
  ];

  const snapshotPayload: StirixiAIInsights = {
    snapshot,
    topEngineers,
    projectHealth,
    pipeline,
    contextBlock: contextLines.join('\n'),
  };

  cachedInsights = {
    data: snapshotPayload,
    expiresAt: Date.now() + INSIGHTS_CACHE_TTL_MS,
  };

  log(
    'Insights snapshot ready in',
    `${Math.round(performance.now() - start)}ms`
  );

  return snapshotPayload;
}

function buildGeminiMessages(
  messages: ChatMessage[],
  contextBlock: string
): GeminiContent[] {
  const seed: GeminiContent = {
    role: 'user',
    parts: [{ text: `${SYSTEM_PROMPT.trim()}\n\nLive context:\n${contextBlock}` }],
  };

  const history: GeminiContent[] = messages.map((message) => ({
    role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: message.content }],
  }));

  return [seed, ...history];
}

async function callGemini(
  contents: GeminiContent[],
  signal?: AbortSignal
) {
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
          maxOutputTokens: 1200,
        },
      }),
      signal,
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

async function callGeminiStream(
  contents: GeminiContent[],
  signal: AbortSignal
) {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
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
          maxOutputTokens: 1200,
        },
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini request failed (${response.status}): ${errorText}`
    );
  }

  return response;
}

export async function GET() {
  const insights = await gatherInsights();
  return NextResponse.json({ insights });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const messages = (body?.messages ?? []) as ChatMessage[];
  const useStreaming = body?.stream ?? true;

  const insights = await gatherInsights();
  const contents = buildGeminiMessages(messages, insights.contextBlock);

  try {
    if (useStreaming) {
      const abortController = new AbortController();
      const geminiResponse = await callGeminiStream(
        contents,
        abortController.signal
      );

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = geminiResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = '';
          let chunkCount = 0;
          let timeoutId: NodeJS.Timeout | null = null;

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                status: 'context_ready',
                snapshot: insights.snapshot,
              })}\n\n`
            )
          );

          const resetTimeout = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
              console.error('[StirixiAI] Gemini stream timed out');
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    error: 'Gemini stream timed out',
                  })}\n\n`
                )
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              abortController.abort();
            }, GEMINI_STREAM_TIMEOUT_MS);
          };

          const clearTimeoutIfNeeded = () => {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          };

          resetTimeout();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              resetTimeout();

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                // Handle Gemini's SSE format
                if (trimmed.startsWith('data: ')) {
                  const jsonStr = trimmed.slice(6).trim();

                  // Skip [DONE] marker
                  if (jsonStr === '[DONE]') {
                    console.log('Received [DONE] from Gemini');
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(jsonStr);
                    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (text) {
                      chunkCount += 1;
                      log('Streaming chunk:', text.substring(0, 50) + '...');
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                      );
                    }
                  } catch (e) {
                    console.error('JSON parse error:', e);
                    console.error('Failed to parse:', jsonStr.substring(0, 100));
                  }
                }
              }
            }

            log('Stream completed successfully');
          } catch (error) {
            console.error('[StirixiAI] Stream error:', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`
              )
            );
          } finally {
            clearTimeoutIfNeeded();
            if (chunkCount === 0) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    text:
                      'I was unable to synthesize a response from Gemini. Please try again.',
                  })}\n\n`
                )
              );
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const abortController = new AbortController();
      const reply = await callGemini(contents, abortController.signal);
      return NextResponse.json({
        message: reply,
        insights,
      });
    }
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
