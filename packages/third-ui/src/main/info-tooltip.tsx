'use client';

import { useEffect, useRef, useState } from 'react';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeBorderColor, themeIconColor, themeRingColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

type InfoTooltipProps = {
  content: string;
  className?: string;
  align?: 'start' | 'end';
  desktopSide?: 'right' | 'bottom';
};

export function InfoTooltip({
  content,
  className,
  align = 'end',
  desktopSide = 'right',
}: InfoTooltipProps) {
  const normalizedContent = content.trim();
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  if (!normalizedContent) {
    return null;
  }

  return (
    <span
      ref={containerRef}
      className={cn('relative inline-flex h-5 w-5 shrink-0 align-middle', className)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition',
          'hover:bg-black/5 hover:dark:bg-white/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-950',
          'hover:text-slate-700 dark:hover:text-white focus-visible:text-slate-700 dark:focus-visible:text-white',
          themeIconColor,
          themeRingColor,
        )}
        aria-label={normalizedContent}
        aria-expanded={open}
      >
        <icons.CircleQuestionMark className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'pointer-events-none absolute top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border bg-white/95 px-3 py-2 text-xs leading-5 text-slate-600 shadow-xl backdrop-blur-sm dark:bg-slate-950/95 dark:text-slate-300',
          align === 'start' ? 'left-0 right-auto' : 'right-0 left-auto',
          desktopSide === 'right'
            ? align === 'start'
              ? 'sm:left-0 sm:right-auto md:left-full md:right-auto md:top-1/2 md:mt-0 md:ml-2 md:-translate-y-1/2'
              : 'sm:right-0 sm:left-auto md:left-full md:right-auto md:top-1/2 md:mt-0 md:ml-2 md:-translate-y-1/2'
            : align === 'start'
              ? 'md:left-0 md:right-auto md:top-full md:mt-2 md:ml-0 md:translate-y-0'
              : 'md:right-0 md:left-auto md:top-full md:mt-2 md:ml-0 md:translate-y-0',
          open ? 'block' : 'hidden',
          themeBorderColor,
        )}
        role="tooltip"
      >
        {normalizedContent}
      </span>
    </span>
  );
}
