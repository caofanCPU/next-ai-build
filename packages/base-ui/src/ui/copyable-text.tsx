'use client';

import { CheckIcon } from '@base-ui/icons';
import * as React from 'react';
import { useState } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';

export function CopyableText({
  text,
  children,
}: {
  text: string;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // do nothing, just silence fail
    }
  };

  if (!text) return <span className="text-slate-400">--</span>;

  return (
    // div + onMouseDown + preventDefault
    <div
      onMouseDown={handleCopy}
      className={cn(
        'group relative inline-flex items-center gap-1.5 rounded-md',
        'px-1.5 -mx-1.5 py-0.5 cursor-pointer select-text',
        'hover:bg-purple-50 hover:text-purple-700',
        'dark:hover:bg-purple-500/10 dark:hover:text-purple-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
        'transition-all',
        'text-[0.5rem] sm:text-[0.625rem] md:text-xs font-mono leading-tight',
        'min-h-4'
      )}
      title="Click to copy"
    >
      <span className="break-all">
        {children || text}
      </span>

      <CheckIcon
        className={cn(
          'size-3 shrink-0',
          'transition-opacity duration-200',
          copied ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
