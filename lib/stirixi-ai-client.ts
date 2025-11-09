'use client';

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type StirixiAIInsights = {
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

export const INTRO_MESSAGE =
  'Hi, I’m StirixiAI. I can synthesize engineering performance, highlight risk, and help you call shots across delivery, hiring, and AI efficiency. Ask me anything from “Where do we need more staffing?” to “Draft talking points for the board.”';

export const CTA_SUGGESTIONS = [
  'Give me a readiness summary for the next board sync.',
  'Where should we rebalance engineers to protect roadmap confidence?',
  'Which prospects should we prioritize for the data platform initiative?',
  'How is AI investment tracking vs. delivery gains this month?',
];

type ChatResponse = {
  message: string;
  insights: StirixiAIInsights;
  error?: string;
};

function formatContent(text: string): string {
  return text.trim();
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function useStirixiAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'intro', role: 'assistant', content: INTRO_MESSAGE },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<StirixiAIInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const hydrateInsights = useCallback(async () => {
    try {
      const response = await fetch('/api/stirixi-ai', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load org snapshot');
      }
      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Failed to hydrate StirixiAI insights', err);
    }
  }, []);

  useEffect(() => {
    hydrateInsights();
  }, [hydrateInsights]);

  const postToAPI = useCallback(async (history: ChatMessage[]) => {
    const response = await fetch('/api/stirixi-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.map(({ role, content }) => ({
          role,
          content,
        })),
      }),
    });
    const data = (await response.json()) as ChatResponse;
    if (!response.ok) {
      throw new Error(data.error || 'Unable to reach StirixiAI');
    }
    return data;
  }, []);

  const sendMessage = useCallback(
    async (override?: string) => {
      const prompt = formatContent((override ?? input).trim());
      if (!prompt) return;

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: prompt,
      };

      const history = [...messagesRef.current, userMessage];
      setMessages(history);
      messagesRef.current = history;

      setInput('');
      setLoading(true);
      setError(null);

      try {
        const data = await postToAPI(history);
        setInsights(data.insights);
        const reply: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: data.message,
        };
        const updatedHistory = [...history, reply];
        setMessages(updatedHistory);
        messagesRef.current = updatedHistory;
      } catch (err) {
        const fallback =
          err instanceof Error ? err.message : 'Unexpected StirixiAI error';
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: 'assistant',
            content: `I hit an issue reaching Gemini (${fallback}). Give it another try once networking settles.`,
          },
        ]);
        setError(fallback);
      } finally {
        setLoading(false);
      }
    },
    [input, postToAPI]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage();
    },
    [sendMessage]
  );

  return {
    messages,
    input,
    setInput,
    loading,
    insights,
    error,
    sendMessage,
    handleSubmit,
  };
}
