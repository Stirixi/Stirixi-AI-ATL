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

  const postToAPI = useCallback(async (
    history: ChatMessage[],
    onChunk?: (text: string) => void
  ) => {
    const response = await fetch('/api/stirixi-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.map(({ role, content }) => ({
          role,
          content,
        })),
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Unable to reach StirixiAI');
    }

    // Handle streaming response
    if (onChunk && response.body) {
      console.log('Starting stream reading...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('Stream finished, total text:', fullText.length);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  console.log('Received chunk, total length:', fullText.length);
                  onChunk(fullText);
                } else {
                  console.log('Parsed data but no text:', parsed);
                }
              } catch (e) {
                console.error('JSON parse error in stream:', e);
                console.error('Failed data:', data);
              }
            }
          }
        }
      } catch (error) {
        console.error('Stream reading error:', error);
        throw error;
      }

      console.log('Returning full message:', fullText.substring(0, 50) + '...');
      return { message: fullText, insights: null };
    }

    // Handle non-streaming response
    const data = (await response.json()) as ChatResponse;
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

      // Create a placeholder message for streaming
      const replyId = createId();
      const streamingReply: ChatMessage = {
        id: replyId,
        role: 'assistant',
        content: '',
      };

      const historyWithPlaceholder = [...history, streamingReply];
      setMessages(historyWithPlaceholder);

      try {
        const data = await postToAPI(history, (text) => {
          // Update the streaming message in real-time
          const updatedMessages = historyWithPlaceholder.map((msg) =>
            msg.id === replyId ? { ...msg, content: text } : msg
          );
          setMessages(updatedMessages);
          messagesRef.current = updatedMessages;
        });

        if (data.insights) {
          setInsights(data.insights);
        }

        // Final update with complete message (in case streaming didn't capture everything)
        const finalReply: ChatMessage = {
          id: replyId,
          role: 'assistant',
          content: data.message,
        };
        const updatedHistory = [...history, finalReply];
        setMessages(updatedHistory);
        messagesRef.current = updatedHistory;
      } catch (err) {
        const fallback =
          err instanceof Error ? err.message : 'Unexpected StirixiAI error';

        // Remove the placeholder and add error message
        setMessages([
          ...history,
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
