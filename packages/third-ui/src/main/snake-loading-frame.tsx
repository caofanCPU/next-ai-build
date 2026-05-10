'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@windrun-huaiin/lib/utils';
import { AnimeBeamFrame } from './anime';
import type { BeamFrameTone } from './beam-frame-config';

type SnakeShape = 'circle' | 'rounded-rect';

export interface SnakeLoadingFrameProps {
  shape: SnakeShape;
  loading: boolean;
  children: ReactNode;
  paused?: boolean;
  className?: string;
  themeColor?: string;
  tone?: BeamFrameTone;
  strokeWidth?: number;
  contentClassName?: string;
}

export interface SnakeLoadingPreviewProps {
  shape: SnakeShape;
  children: ReactNode;
  className?: string;
  themeColor?: string;
  tone?: BeamFrameTone;
  defaultProgress?: number;
  strokeWidth?: number;
  contentClassName?: string;
}

const DEFAULT_THEME_COLOR = '#3b82f6';
const EXIT_DURATION_MS = 260;
const LOOP_DURATION_SECONDS = 1.85;
const DEFAULT_CIRCLE_STROKE = 0.5;
const DEFAULT_RECT_STROKE = 1;

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, progress));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace('#', '').trim();

  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

function createBodyTailColor(themeColor: string): string {
  const rgb = hexToRgb(themeColor);

  if (!rgb) {
    return 'rgba(59, 130, 246, 0.18)';
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.18)`;
}

function StaticProgressFrame({
  shape,
  progress,
  themeColor,
}: {
  shape: SnakeShape;
  progress: number;
  themeColor: string;
}) {
  const trackColor = 'rgba(148, 163, 184, 0.22)';
  const progressRatio = clampProgress(progress);

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 p-px',
        shape === 'circle' ? 'rounded-full' : 'rounded-[inherit]',
      )}
      style={{
        background: `conic-gradient(${themeColor} 0% ${progressRatio}%, ${trackColor} ${progressRatio}% 100%)`,
        mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        maskComposite: 'exclude',
        WebkitMask:
          'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor',
      }}
    />
  );
}

function SnakeFrameBase({
  shape,
  loading,
  children,
  paused = false,
  className,
  themeColor = DEFAULT_THEME_COLOR,
  tone = 'rainbow',
  previewProgress,
  strokeWidth,
  contentClassName,
}: SnakeLoadingFrameProps & { previewProgress?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [frameRadius, setFrameRadius] = useState<number | undefined>(
    shape === 'circle' ? 999 : undefined,
  );
  const [showOverlay, setShowOverlay] = useState(loading || previewProgress !== undefined);
  const exitTimerRef = useRef<number | null>(null);
  const resolvedStrokeWidth =
    strokeWidth ?? (shape === 'circle' ? DEFAULT_CIRCLE_STROKE : DEFAULT_RECT_STROKE);
  const circleContentInset =
    shape === 'circle' ? Math.max(6, resolvedStrokeWidth + 4) : 0;
  const isPreview = previewProgress !== undefined;
  const isActivelyLoading = loading && !paused && !isPreview;

  useEffect(() => {
    if (shape === 'circle') {
      setFrameRadius(999);
      return;
    }

    const node = containerRef.current;

    if (!node) {
      return;
    }

    const updateRadius = () => {
      const computedStyle = window.getComputedStyle(node);
      const nextRadius = Number.parseFloat(computedStyle.borderTopLeftRadius);

      setFrameRadius(Number.isFinite(nextRadius) ? nextRadius : undefined);
    };

    updateRadius();

    const resizeObserver = new ResizeObserver(updateRadius);
    const mutationObserver = new MutationObserver(updateRadius);

    resizeObserver.observe(node);
    mutationObserver.observe(node, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [shape]);

  useEffect(() => {
    if (isPreview) {
      setShowOverlay(true);
      return;
    }

    if (loading) {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      setShowOverlay(true);
      return;
    }

    exitTimerRef.current = window.setTimeout(() => {
      setShowOverlay(false);
      exitTimerRef.current = null;
    }, EXIT_DURATION_MS);

    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [isPreview, loading]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative isolate',
        shape === 'circle' ? 'rounded-full' : 'rounded-none',
        className,
      )}
    >
      <div
        className={cn(
          'relative z-0 overflow-hidden',
          shape === 'circle'
            ? 'absolute flex items-center justify-center rounded-full'
            : 'h-full w-full',
          contentClassName,
        )}
        style={
          shape === 'circle'
            ? {
                inset: circleContentInset,
              }
            : undefined
        }
      >
        {children}
      </div>
      {showOverlay ? (
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-visible"
          initial={false}
          animate={{ opacity: loading || isPreview ? 1 : 0 }}
          transition={{ duration: EXIT_DURATION_MS / 1000, ease: 'easeOut' }}
        >
          {isPreview ? (
            <StaticProgressFrame
              shape={shape}
              progress={previewProgress}
              themeColor={themeColor}
            />
          ) : (
            <AnimeBeamFrame
              active={isActivelyLoading}
              interactive={false}
              tone={tone}
              duration={LOOP_DURATION_SECONDS}
              radius={frameRadius}
              className="absolute inset-0 h-full w-full"
            >
              <div className="h-full w-full" />
            </AnimeBeamFrame>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}

export function SnakeLoadingFrame(props: SnakeLoadingFrameProps) {
  return <SnakeFrameBase {...props} />;
}

export function SnakeLoadingPreview({
  shape,
  children,
  className,
  themeColor = DEFAULT_THEME_COLOR,
  tone = 'rainbow',
  defaultProgress = 32,
  strokeWidth,
  contentClassName,
}: SnakeLoadingPreviewProps) {
  const [progress, setProgress] = useState(clampProgress(defaultProgress));
  const sliderFillColor = themeColor;
  const sliderGlowColor = createBodyTailColor(themeColor);
  const sliderBackground = `linear-gradient(90deg, ${sliderGlowColor} 0%, ${sliderFillColor} ${progress}%, rgba(148, 163, 184, 0.24) ${progress}%, rgba(148, 163, 184, 0.24) 100%)`;

  return (
    <div className="space-y-3">
      <SnakeFrameBase
        shape={shape}
        loading
        previewProgress={progress}
        className={className}
        themeColor={themeColor}
        tone={tone}
        strokeWidth={strokeWidth}
        contentClassName={contentClassName}
      >
        {children}
      </SnakeFrameBase>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <span>Snake Preview</span>
          <span>{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(event) => {
            setProgress(clampProgress(Number(event.target.value)));
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{
            background: sliderBackground,
            accentColor: themeColor,
          }}
          aria-label="Preview snake loading progress"
        />
      </div>
    </div>
  );
}
