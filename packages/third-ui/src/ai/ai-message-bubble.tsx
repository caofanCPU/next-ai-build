'use client';

import { getMessageText, type ConversationMessage } from '@windrun-huaiin/contracts/ai';
import { cn } from '@windrun-huaiin/lib/utils';
import type { AIMessageBubbleProps, AIMessageRuntimeMetadata } from './types';
import { AIStatusIndicator } from './ai-status-indicator';

function getRoleLabel(role: ConversationMessage['role']) {
  switch (role) {
    case 'assistant':
      return 'Assistant';
    case 'system':
      return 'System';
    case 'tool':
      return 'Tool';
    default:
      return 'You';
  }
}

function getRuntimeMetadata(message: ConversationMessage): AIMessageRuntimeMetadata {
  const metadata = message.metadata?.aiRuntime;
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return metadata as AIMessageRuntimeMetadata;
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined || Number.isNaN(durationMs)) {
    return '--';
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}

export function AIMessageBubble({ message, className }: AIMessageBubbleProps) {
  const isUser = message.role === 'user';
  const runtimeMetadata = getRuntimeMetadata(message);

  return (
    <div
      className={cn(
        'flex w-full',
        isUser ? 'justify-end' : 'justify-start',
        className,
      )}
    >
      <article
        className={cn(
          'max-w-[88%] rounded-3xl border px-4 py-3 sm:max-w-[82%]',
          isUser
            ? 'border-foreground/10 bg-foreground text-background'
            : 'border-border bg-background text-foreground',
        )}
      >
        <div className="mb-2 flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
            {getRoleLabel(message.role)}
          </span>
        </div>
        <div className="whitespace-pre-wrap break-words text-sm leading-7">
          {getMessageText(message) || message.errorMessage || ''}
        </div>
        {!isUser ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-1">
              First Token {formatDuration(runtimeMetadata.firstTokenMs)}
            </span>
            <span className="rounded-full bg-muted px-2 py-1">
              Total {formatDuration(runtimeMetadata.totalMs)}
            </span>
            <AIStatusIndicator message={message} />
            {message.failureReason ? (
              <span className="rounded-full bg-muted px-2 py-1">
                Reason {message.failureReason}
              </span>
            ) : null}
          </div>
        ) : null}
      </article>
    </div>
  );
}
