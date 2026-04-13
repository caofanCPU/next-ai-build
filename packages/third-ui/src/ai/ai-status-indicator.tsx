'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import type { AIStatusIndicatorProps } from './types';

function getLabel(status?: string) {
  switch (status) {
    case 'streaming':
      return 'Streaming';
    case 'completed':
      return 'Completed';
    case 'stopped':
      return 'Stopped';
    case 'timeout':
      return 'Timeout';
    case 'request_aborted':
      return 'Aborted';
    case 'failed':
      return 'Failed';
    default:
      return null;
  }
}

export function AIStatusIndicator({ message, className }: AIStatusIndicatorProps) {
  const label = getLabel(message.status);
  if (!label) {
    return null;
  }

  return (
    <span
      className={cn(
        'rounded-full border border-border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground',
        className,
      )}
    >
      {label}
    </span>
  );
}
