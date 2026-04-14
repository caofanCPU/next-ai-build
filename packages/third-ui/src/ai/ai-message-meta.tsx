'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { AIStatusIndicator } from './ai-status-indicator';
import type { AIMessageMetaProps, AIMessageRuntimeMetadata } from './types';

function getRuntimeMetadata(message: AIMessageMetaProps['message']): AIMessageRuntimeMetadata {
  const metadata = message.metadata?.aiRuntime;
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return metadata as AIMessageRuntimeMetadata;
}

function formatDuration(durationMs?: number) {
  if (durationMs === undefined || Number.isNaN(durationMs)) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}

function formatTime(createdAt: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(createdAt);
}

export function AIMessageMeta({
  message,
  className,
  showTime = true,
  showStatus = true,
  showRuntime = true,
  showFailureReason = true,
}: AIMessageMetaProps) {
  const runtime = getRuntimeMetadata(message);
  const firstToken = formatDuration(runtime.firstTokenMs);
  const total = formatDuration(runtime.totalMs);

  return (
    <div className={cn('flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground', className)}>
      {showTime ? <span>{formatTime(message.createdAt)}</span> : null}
      {showStatus ? <AIStatusIndicator message={message} /> : null}
      {showRuntime && firstToken ? <span>First Token {firstToken}</span> : null}
      {showRuntime && total ? <span>Total {total}</span> : null}
      {showFailureReason && message.failureReason ? <span>Reason {message.failureReason}</span> : null}
    </div>
  );
}
