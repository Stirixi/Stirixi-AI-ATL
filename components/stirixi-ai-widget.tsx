'use client';

import { Minus, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CTA_SUGGESTIONS, useStirixiAIChat } from '@/lib/stirixi-ai-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

function renderContent(text: string) {
  return text.split('\n').map((line, idx) => (
    <p key={`${line}-${idx}`} className="mb-1 last:mb-0">
      {line}
    </p>
  ));
}

export function StirixiAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, loading, error, sendMessage, handleSubmit } =
    useStirixiAIChat();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:right-4">
      {isOpen && (
        <Card className="flex w-full max-w-full flex-col overflow-hidden border border-border shadow-2xl sm:max-w-md md:max-w-lg">
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                StirixiAI
              </p>
              <p className="text-base font-semibold text-foreground">
                CTO copilot
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3.5 w-3.5" />
                Gemini
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                aria-label="Minimize StirixiAI"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-b border-border px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {CTA_SUGGESTIONS.slice(0, 2).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:bg-secondary/80 hover:text-foreground"
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    isAssistant ? 'items-start' : 'items-end justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      SA
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isAssistant
                        ? 'bg-secondary/60 text-foreground border border-border'
                        : 'bg-primary text-primary-foreground ml-auto'
                    }`}
                  >
                    {renderContent(message.content)}
                  </div>
                  {!isAssistant && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      CTO
                    </div>
                  )}
                </div>
              );
            })}
            {loading && (
              <p className="text-xs text-muted-foreground">
                StirixiAI is synthesizing your org…
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive">
                Last error: {error}. Retrying usually clears transient issues.
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-border px-4 py-3 space-y-2"
          >
            <Textarea
              placeholder="Ask about delivery, risk, or hiring…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>StirixiAI cites live data when available.</span>
              <Button type="submit" disabled={loading || !input.trim()}>
                Send
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex w-full justify-end sm:w-auto">
        <Button
          size="lg"
          className="shadow-lg"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Hide StirixiAI widget' : 'Open StirixiAI widget'}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isOpen ? 'Hide StirixiAI' : 'Chat with StirixiAI'}
        </Button>
      </div>
    </div>
  );
}
