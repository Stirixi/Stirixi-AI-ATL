'use client';

import { Minus, Sparkles, Maximize2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { CTA_SUGGESTIONS, useStirixiAIChat } from '@/lib/stirixi-ai-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export function StirixiAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, setInput, loading, error, sendMessage, handleSubmit } =
    useStirixiAIChat();

  // Check if user has sent at least one message
  const hasUserMessages = messages.some((msg) => msg.role === 'user');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Prevent background scroll when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-end gap-3 sm:left-auto sm:right-4">
      {isOpen && (
        <Card className={`flex w-full flex-col overflow-hidden border border-border shadow-2xl transition-all duration-300 ${
          isExpanded
            ? 'max-w-full h-[calc(100vh-2rem)] sm:max-w-4xl'
            : 'max-w-full sm:max-w-md md:max-w-lg h-[700px]'
        }`}>
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-card to-secondary/20 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                StirixiAI
              </p>
              <p className="text-base font-semibold text-foreground">
                CTO copilot
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                Gemini 2.5 Flash
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <Maximize2 className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-45' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                aria-label="Close StirixiAI"
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!hasUserMessages && (
            <div className="border-b border-border px-4 py-2.5 bg-secondary/10">
              <div className="flex flex-wrap gap-2">
                {CTA_SUGGESTIONS.slice(0, isExpanded ? 4 : 2).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (!loading) {
                        sendMessage(suggestion);
                      }
                    }}
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-transparent to-secondary/5">
            {messages.map((message) => {
              const isAssistant = message.role === 'assistant';
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    isAssistant ? 'items-start' : 'items-end justify-end'
                  }`}
                >
                  {isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-bold text-primary ring-2 ring-primary/20">
                      SA
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
                      isAssistant
                        ? 'bg-card text-foreground border border-border shadow-sm'
                        : 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto shadow-md'
                    }`}
                  >
                    {isAssistant ? (
                      message.content ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs">Synthesizing...</span>
                        </div>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {!isAssistant && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground ring-2 ring-primary/30">
                      CTO
                    </div>
                  )}
                </div>
              );
            })}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive font-medium">
                  Error: {error}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Retrying usually clears transient issues.
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-border bg-gradient-to-b from-secondary/10 to-card px-4 py-3 space-y-2.5"
          >
            <Textarea
              placeholder="Ask about delivery, risk, hiring, or strategic planning…"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              className="min-h-[80px] resize-none border-border focus:border-primary/50 focus:ring-primary/20"
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Enhanced with live org data & AI usage insights
              </span>
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="shadow-sm"
              >
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="flex w-full justify-end sm:w-auto">
        <Button
          size="lg"
          className="shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Hide StirixiAI widget' : 'Open StirixiAI widget'}
        >
          <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
          {isOpen ? 'Hide StirixiAI' : 'Chat with StirixiAI'}
        </Button>
      </div>
    </div>
  );
}
