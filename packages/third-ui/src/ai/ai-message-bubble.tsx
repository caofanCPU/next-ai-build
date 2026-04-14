'use client';

import type { ConversationMessage } from '@windrun-huaiin/contracts/ai';
import { cn } from '@windrun-huaiin/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { AIMessageActions } from './ai-message-actions';
import { AIMessageContent } from './ai-message-content';
import { AIMessageMeta } from './ai-message-meta';
import type { AIMessageBubbleProps } from './types';

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

export function AIMessageBubble({
  message,
  className,
  cardClassName,
  contentClassName,
  footerClassName,
  maxWidthClassName,
  showRoleLabel = false,
  markdownComponents,
  showFooter = true,
  renderContent,
  renderMeta,
  renderActions,
}: AIMessageBubbleProps) {
  const isUser = message.role === 'user';
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);
  const [isCompactSingleLine, setIsCompactSingleLine] = useState(false);
  const content = renderContent
    ? renderContent(message)
    : <AIMessageContent message={message} className={contentClassName} markdownComponents={markdownComponents} />;
  const meta = renderMeta ? renderMeta(message) : <AIMessageMeta message={message} />;
  const actions = renderActions ? renderActions(message) : null;
  const hasFooter = Boolean(meta) || Boolean(actions);
  const isTextOnlyMessage =
    message.parts.length > 0
      ? message.parts.every((part) => part.type === 'text')
      : Boolean(message.errorMessage);

  useEffect(() => {
    if (!isTextOnlyMessage || !contentWrapperRef.current) {
      setIsCompactSingleLine(false);
      return;
    }

    const element = contentWrapperRef.current;

    const measure = () => {
      const computedStyle = window.getComputedStyle(element);
      const lineHeight = Number.parseFloat(computedStyle.lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
        setIsCompactSingleLine(false);
        return;
      }

      const nextIsSingleLine = element.scrollHeight <= lineHeight * 1.75;
      setIsCompactSingleLine(nextIsSingleLine);
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [isTextOnlyMessage, message.errorMessage, message.id, message.parts]);

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
          'min-h-12 min-w-30 max-w-full rounded-3xl border px-4 py-3 sm:min-h-13 sm:min-w-36',
          isUser ? 'w-fit' : 'w-full',
          maxWidthClassName ?? 'max-w-[92%] sm:max-w-[82%]',
          isUser
            ? 'border-foreground/10 bg-foreground text-background'
            : 'border-border bg-background text-foreground',
          cardClassName,
        )}
      >
        {showRoleLabel ? (
          <div className="mb-2 flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-60">
              {getRoleLabel(message.role)}
            </span>
          </div>
        ) : null}

        <div
          ref={contentWrapperRef}
          className={cn(
            'min-w-0',
            isTextOnlyMessage && isCompactSingleLine && 'flex justify-center',
          )}
        >
          {content}
        </div>

        {showFooter && hasFooter ? (
          <div
            className={cn(
              'mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3',
              footerClassName,
            )}
          >
            <div className="min-w-0 flex-1">
              {meta}
            </div>
            {actions ? <AIMessageActions>{actions}</AIMessageActions> : null}
          </div>
        ) : null}
      </article>
    </div>
  );
}
