'use client';

import type { ConversationMessage } from '@windrun-huaiin/contracts/ai';
import { cn } from '@windrun-huaiin/lib/utils';
import { useEffect, useRef } from 'react';
import type { AIMessageListProps } from './types';
import { AIMessageBubble } from './ai-message-bubble';

export function AIMessageList({
  messages,
  className,
  contentClassName,
  emptyText = 'No messages yet.',
  emptyState,
  autoScroll = true,
  scrollBehavior = 'smooth',
  renderMessage,
}: AIMessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!autoScroll) {
      return;
    }

    bottomRef.current?.scrollIntoView({ behavior: scrollBehavior, block: 'end' });
  }, [autoScroll, messages, scrollBehavior]);

  const content = messages.length === 0
    ? (
        emptyState ?? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            {emptyText}
          </div>
        )
      )
    : (
        messages.map((message: ConversationMessage) => (
          <div key={message.id}>
            {renderMessage ? renderMessage(message) : <AIMessageBubble message={message} />}
          </div>
        ))
      );

  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto', className)}>
      <div
        className={cn(
          'mx-auto flex min-h-full w-full max-w-5xl flex-col gap-5 px-1',
          messages.length === 0 ? 'justify-center' : 'justify-end',
          contentClassName,
        )}
      >
        {content}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
