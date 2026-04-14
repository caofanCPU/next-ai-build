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

function getStatusClassName(status?: string) {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'streaming':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300';
    case 'stopped':
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300';
    case 'timeout':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300';
    case 'request_aborted':
      return 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300';
    case 'failed':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300';
    default:
      return 'border-border bg-background text-muted-foreground';
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
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em]',
        getStatusClassName(message.status),
        className,
      )}
    >
      {label}
    </span>
  );
}
