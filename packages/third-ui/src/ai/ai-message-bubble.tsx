'use client';

import { getMessageText, type ConversationMessage } from '@windrun-huaiin/contracts/ai';
import { cn } from '@windrun-huaiin/lib/utils';
import type { AIMessageBubbleProps } from './types';
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

export function AIMessageBubble({ message, className }: AIMessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <article
      className={cn(
        'rounded-2xl border p-4',
        isUser
          ? 'border-foreground/10 bg-foreground text-background'
          : 'border-border bg-background text-foreground',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
          {getRoleLabel(message.role)}
        </span>
        <AIStatusIndicator message={message} />
      </div>
      <div className="whitespace-pre-wrap break-words text-sm leading-6">
        {getMessageText(message) || message.errorMessage || ''}
      </div>
    </article>
  );
}
