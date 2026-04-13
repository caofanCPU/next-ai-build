'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import type { ConversationMessage } from '@windrun-huaiin/contracts/ai';
import type { AIMessageListProps } from './types';
import { AIMessageBubble } from './ai-message-bubble';

export function AIMessageList({
  messages,
  className,
  emptyText = 'No messages yet.',
}: AIMessageListProps) {
  if (messages.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground',
          className,
        )}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div className={cn('space-y-5', className)}>
      {messages.map((message: ConversationMessage) => (
        <AIMessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}
