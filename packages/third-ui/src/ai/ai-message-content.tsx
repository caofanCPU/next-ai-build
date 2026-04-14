'use client';

import type { MessagePart } from '@windrun-huaiin/contracts/ai';
import { themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import { TrophyCard } from '../fuma/mdx/trophy-card';
import { AIMarkdown } from './ai-markdown';
import type { AIMessageContentProps } from './types';

function hasRenderablePart(part: MessagePart) {
  if (part.type === 'text') {
    return part.text.trim().length > 0;
  }

  return true;
}

function getEmptyAssistantFallback(message: AIMessageContentProps['message']) {
  if (message.status === 'streaming') {
    return null;
  }

  if (message.status === 'timeout') {
    return 'No response received. The request timed out before the model returned any content.';
  }

  if (message.status === 'request_aborted' || message.status === 'stopped') {
    return 'Response stopped before any content was returned.';
  }

  if (message.status === 'failed') {
    return message.errorMessage || 'The model did not return any visible content.';
  }

  if (message.errorMessage) {
    return message.errorMessage;
  }

  return 'The model returned no visible content.';
}

function renderPart(
  part: MessagePart,
  index: number,
  markdownComponents?: AIMessageContentProps['markdownComponents'],
) {
  if (part.type === 'text') {
    return (
      <AIMarkdown
        key={`text-${index}`}
        content={part.text}
        components={markdownComponents}
      />
    );
  }

  if (part.type === 'image') {
    return (
      <div
        key={`image-${index}`}
        className="rounded-2xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground"
      >
        Image part reserved: {part.alt || part.url}
      </div>
    );
  }

  if (part.type === 'trophy_card') {
    return (
      <div
        key={`trophy-card-${index}`}
        className="rounded-2xl bg-muted/35 p-1 text-foreground"
      >
        <TrophyCard title={part.title}>
          {part.description ? (
            <div className="mt-2">
              <AIMarkdown
                content={part.description}
                components={markdownComponents}
                className="space-y-3 text-sm text-inherit"
              />
            </div>
          ) : null}
        </TrophyCard>
      </div>
    );
  }

  return (
    <div
      key={`file-${index}`}
      className="rounded-2xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground"
    >
      File part reserved: {part.name || part.url}
    </div>
  );
}

export function AIMessageContent({
  message,
  className,
  markdownComponents,
}: AIMessageContentProps) {
  const parts = message.parts.filter(hasRenderablePart);

  if (
    message.role === 'assistant' &&
    message.status === 'streaming' &&
    parts.length === 0
  ) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm text-muted-foreground',
          themeIconColor,
          className,
        )}
      >
        <span>AI is thinking</span>
        <span className="inline-flex items-center gap-1" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:0ms]" />
          <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:180ms]" />
          <span className="size-1.5 rounded-full bg-current animate-pulse [animation-delay:360ms]" />
        </span>
      </div>
    );
  }

  if (parts.length === 0) {
    const fallbackText = getEmptyAssistantFallback(message);
    if (!fallbackText) {
      return null;
    }

    return (
      <AIMarkdown
        content={fallbackText}
        components={markdownComponents}
        className={cn('space-y-3 text-sm text-inherit', className)}
      />
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {parts.map((part, index) => renderPart(part, index, markdownComponents))}
    </div>
  );
}
