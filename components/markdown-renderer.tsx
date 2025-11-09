import React from 'react';

type MarkdownRendererProps = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc list-inside mb-3 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="ml-2">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre key={`pre-${elements.length}`} className="bg-secondary/40 rounded-md p-3 mb-3 overflow-x-auto border border-border">
            <code className="text-xs font-mono">{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
      }
    };

    lines.forEach((line, idx) => {
      // Code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${idx}`} className="text-base font-bold mb-2 mt-3">
            {parseInlineMarkdown(line.slice(4))}
          </h3>
        );
        return;
      }
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${idx}`} className="text-lg font-bold mb-2 mt-4">
            {parseInlineMarkdown(line.slice(3))}
          </h2>
        );
        return;
      }
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${idx}`} className="text-xl font-bold mb-3 mt-4">
            {parseInlineMarkdown(line.slice(2))}
          </h1>
        );
        return;
      }

      // Lists
      if (line.trim().match(/^[-*]\s/)) {
        listItems.push(line.trim().slice(2));
        return;
      }
      if (line.trim().match(/^\d+\.\s/)) {
        listItems.push(line.trim().replace(/^\d+\.\s/, ''));
        return;
      }

      // Flush list if we hit non-list content
      if (line.trim() !== '' && listItems.length > 0) {
        flushList();
      }

      // Empty lines
      if (line.trim() === '') {
        elements.push(<div key={`space-${idx}`} className="h-2" />);
        return;
      }

      // Regular paragraphs
      if (line.trim()) {
        elements.push(
          <p key={`p-${idx}`} className="mb-2 leading-relaxed">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    });

    // Flush any remaining items
    flushList();
    flushCodeBlock();

    return elements;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let current = '';
    let i = 0;

    const flushCurrent = () => {
      if (current) {
        parts.push(current);
        current = '';
      }
    };

    while (i < text.length) {
      // Bold **text**
      if (text.slice(i, i + 2) === '**') {
        flushCurrent();
        const endIdx = text.indexOf('**', i + 2);
        if (endIdx !== -1) {
          const boldText = text.slice(i + 2, endIdx);
          parts.push(
            <strong key={`bold-${i}`} className="font-semibold">
              {boldText}
            </strong>
          );
          i = endIdx + 2;
          continue;
        }
      }

      // Italic *text*
      if (text[i] === '*' && text[i - 1] !== '*' && text[i + 1] !== '*') {
        flushCurrent();
        const endIdx = text.indexOf('*', i + 1);
        if (endIdx !== -1) {
          const italicText = text.slice(i + 1, endIdx);
          parts.push(
            <em key={`italic-${i}`} className="italic">
              {italicText}
            </em>
          );
          i = endIdx + 1;
          continue;
        }
      }

      // Inline code `text`
      if (text[i] === '`') {
        flushCurrent();
        const endIdx = text.indexOf('`', i + 1);
        if (endIdx !== -1) {
          const codeText = text.slice(i + 1, endIdx);
          parts.push(
            <code
              key={`code-${i}`}
              className="bg-secondary/60 px-1.5 py-0.5 rounded text-xs font-mono border border-border"
            >
              {codeText}
            </code>
          );
          i = endIdx + 1;
          continue;
        }
      }

      current += text[i];
      i++;
    }

    flushCurrent();
    return parts.length > 0 ? parts : text;
  };

  return <div className={`markdown-content ${className}`}>{parseMarkdown(content)}</div>;
}
