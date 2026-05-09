'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleQuestionMarkIcon } from '@windrun-huaiin/base-ui/icons';
import { themeBorderColor, themeIconColor, themeRingColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

type InfoTooltipProps = {
  content: string;
  className?: string;
  align?: 'start' | 'end';
  desktopSide?: 'right' | 'bottom';
};

type TooltipPosition = {
  left: number;
  top: number;
  maxWidth: number;
  side: 'bottom' | 'inline';
};

const TOOLTIP_MARGIN = 12;
const TOOLTIP_GAP = 8;
const TOOLTIP_MAX_WIDTH = 288;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTooltipPosition(
  target: HTMLElement,
  align: NonNullable<InfoTooltipProps['align']>,
  desktopSide: NonNullable<InfoTooltipProps['desktopSide']>,
): TooltipPosition {
  const rect = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const maxWidth = Math.min(
    TOOLTIP_MAX_WIDTH,
    Math.max(160, viewportWidth - TOOLTIP_MARGIN * 2),
  );
  const useInlineSide = desktopSide === 'right' && viewportWidth >= 768;

  if (useInlineSide) {
    const rightSpace = viewportWidth - rect.right - TOOLTIP_GAP - TOOLTIP_MARGIN;
    const leftSpace = rect.left - TOOLTIP_GAP - TOOLTIP_MARGIN;
    const placeRight = rightSpace >= Math.min(220, maxWidth) || rightSpace >= leftSpace;
    const preferredLeft = placeRight
      ? rect.right + TOOLTIP_GAP
      : rect.left - maxWidth - TOOLTIP_GAP;

    return {
      left: clamp(preferredLeft, TOOLTIP_MARGIN, viewportWidth - maxWidth - TOOLTIP_MARGIN),
      top: clamp(
        rect.top + rect.height / 2,
        TOOLTIP_MARGIN + 40,
        viewportHeight - TOOLTIP_MARGIN - 40,
      ),
      maxWidth,
      side: 'inline',
    };
  }

  const preferredLeft = align === 'start'
    ? rect.left
    : rect.right - maxWidth;

  return {
    left: clamp(preferredLeft, TOOLTIP_MARGIN, viewportWidth - maxWidth - TOOLTIP_MARGIN),
    top: Math.min(rect.bottom + TOOLTIP_GAP, viewportHeight - TOOLTIP_MARGIN),
    maxWidth,
    side: 'bottom',
  };
}

export function InfoTooltip({
  content,
  className,
  align = 'end',
  desktopSide = 'right',
}: InfoTooltipProps) {
  const normalizedContent = content.trim();
  const containerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const updatePosition = () => {
    if (!containerRef.current) {
      return;
    }

    setPosition(getTooltipPosition(containerRef.current, align, desktopSide));
  };

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Node &&
        !containerRef.current.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
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

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, desktopSide, open]);

  if (!normalizedContent) {
    return null;
  }

  return (
    <span
      ref={containerRef}
      className={cn('inline-flex h-5 w-5 shrink-0 align-middle', className)}
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
        <CircleQuestionMarkIcon className="h-4 w-4" />
      </button>
      {open && position
        ? createPortal(
          <span
            ref={tooltipRef}
            className={cn(
              'pointer-events-none fixed z-50 max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl border bg-white/95 px-3 py-2 text-xs leading-5 text-slate-600 shadow-xl backdrop-blur-sm dark:bg-slate-950/95 dark:text-slate-300',
              position.side === 'inline' && '-translate-y-1/2',
              themeBorderColor,
            )}
            style={{
              left: position.left,
              top: position.top,
              width: position.maxWidth,
            }}
            role="tooltip"
          >
            {normalizedContent}
          </span>,
          document.body,
        )
        : null}
    </span>
  );
}
