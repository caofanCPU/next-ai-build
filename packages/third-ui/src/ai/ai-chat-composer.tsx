'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { AIChatComposerProps } from './types';

function resizeTextarea(
  textarea: HTMLTextAreaElement,
  minHeight: number,
  maxHeight: number,
) {
  textarea.style.height = 'auto';
  const nextHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

export function AIChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = 'Ask anything...',
  className,
  leftSlot,
  attachments,
  helper,
  submitLabel = 'Send',
  stopLabel = 'Stop',
  minHeight = 52,
  maxHeight = 220,
  submitOnEnter = true,
  shellClassName,
  textareaClassName,
  submitControl,
  stopControl,
  textareaRef: externalTextareaRef,
  secondaryActions,
  actionLayout = 'inline',
}: AIChatComposerProps) {
  const internalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = externalTextareaRef ?? internalTextareaRef;

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    resizeTextarea(textareaRef.current, minHeight, maxHeight);
  }, [actionLayout, maxHeight, minHeight, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!submitOnEnter || event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (isStreaming && onStop) {
        onStop();
        return;
      }

      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  };

  const primaryAction = isStreaming && onStop
    ? (
        stopControl ?? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-border px-4 text-sm text-foreground transition hover:bg-muted"
          >
            {stopLabel}
          </button>
        )
      )
    : (
        submitControl ?? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || isStreaming || value.trim().length === 0}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-foreground px-4 text-sm text-background transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitLabel}
          </button>
        )
      );

  if (actionLayout === 'stacked') {
    return (
      <div className={cn('space-y-3', className)}>
        {attachments ? <div>{attachments}</div> : null}

        <div
          className={cn(
            'rounded-3xl border border-border bg-background px-3 py-3',
            shellClassName,
          )}
        >
          <div className="flex items-end gap-3">
            <div className="flex shrink-0 items-center">
              {leftSlot}
            </div>

            <div className="min-w-0 flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                  'block w-full resize-none border-0 bg-transparent px-0 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 box-border',
                  textareaClassName,
                )}
                style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {secondaryActions}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {primaryAction}
            </div>
          </div>
        </div>

        {helper ? <div>{helper}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {attachments ? <div>{attachments}</div> : null}

      <div
        className={cn(
          'flex items-end gap-3 rounded-3xl border border-border bg-background px-3 py-3',
          shellClassName,
        )}
      >
        <div className="flex shrink-0 items-center">
          {leftSlot}
        </div>

        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'block w-full resize-none border-0 bg-transparent px-0 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 box-border',
              textareaClassName,
            )}
            style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {secondaryActions}
          {primaryAction}
        </div>
      </div>

      {helper ? <div>{helper}</div> : null}
    </div>
  );
}
