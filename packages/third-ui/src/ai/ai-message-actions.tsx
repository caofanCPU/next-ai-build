'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import type { AIMessageActionsProps } from './types';

export function AIMessageActions({ className, children }: AIMessageActionsProps) {
  if (!children) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>
      {children}
    </div>
  );
}
