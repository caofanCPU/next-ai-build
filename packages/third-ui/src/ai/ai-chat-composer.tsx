'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { AIPromptTextarea } from '../main/ai-prompt-textarea';
import type { AIChatComposerProps } from './types';

export function AIChatComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = 'Ask anything...',
  className,
}: AIChatComposerProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <AIPromptTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled || isStreaming}
        isWordLimit={false}
        onWordLimitChange={() => {}}
        minHeight={120}
        maxHeight={260}
      />
      <div className="flex items-center justify-end gap-3">
        {isStreaming && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="rounded-md border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted"
          >
            Stop
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isStreaming || value.trim().length === 0}
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
