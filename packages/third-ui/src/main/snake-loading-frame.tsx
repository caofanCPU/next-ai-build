'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@windrun-huaiin/lib/utils';

type SnakeShape = 'circle' | 'rounded-rect';

interface SnakeLoadingFrameProps {
  shape: SnakeShape;
  loading: boolean;
  children: ReactNode;
  className?: string;
  themeColor?: string;
  strokeWidth?: number;
  contentClassName?: string;
}

interface SnakeLoadingPreviewProps {
  shape: SnakeShape;
  children: ReactNode;
  className?: string;
  themeColor?: string;
  defaultProgress?: number;
  strokeWidth?: number;
  contentClassName?: string;
}

const DEFAULT_THEME_COLOR = '#3b82f6';
const TRACK_COLOR = 'rgba(148, 163, 184, 0.22)';
const BODY_LENGTH_RATIO = 0.26;
const EXIT_DURATION_MS = 260;
const LOOP_DURATION_SECONDS = 1.85;
const CIRCLE_VIEWBOX = 120;
const ROUNDED_RECT_WIDTH = 160;
const ROUNDED_RECT_HEIGHT = 90;
const ROUNDED_RECT_RADIUS = 8;
const DEFAULT_CIRCLE_STROKE = 6;
const DEFAULT_RECT_STROKE = 5;

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

function SnakeRingSvg({
  shape,
  themeColor,
  progressRatio,
  animate,
  strokeWidth,
}: {
  shape: SnakeShape;
  themeColor: string;
  progressRatio: number;
  animate: boolean;
  strokeWidth?: number;
}) {
  const tailColor = createBodyTailColor(themeColor);

  const geometry = useMemo(() => {
    if (shape === 'circle') {
      const center = CIRCLE_VIEWBOX / 2;
      const resolvedStrokeWidth = strokeWidth ?? DEFAULT_CIRCLE_STROKE;
      const radius = center - resolvedStrokeWidth;
      const circumference = 2 * Math.PI * radius;

      return {
        viewBox: `0 0 ${CIRCLE_VIEWBOX} ${CIRCLE_VIEWBOX}`,
        path: `M ${center} ${center} m 0 -${radius} a ${radius} ${radius} 0 1 1 0 ${
          radius * 2
        } a ${radius} ${radius} 0 1 1 0 -${radius * 2}`,
        length: circumference,
        strokeWidth: resolvedStrokeWidth,
      };
    }

    const resolvedStrokeWidth = strokeWidth ?? DEFAULT_RECT_STROKE;
    const inset = resolvedStrokeWidth / 2;
    const width = ROUNDED_RECT_WIDTH;
    const height = ROUNDED_RECT_HEIGHT;
    const maxRadius = Math.min((width - inset * 2) / 2, (height - inset * 2) / 2);
    const radius = Math.min(ROUNDED_RECT_RADIUS, maxRadius);
    const innerWidth = width - inset * 2;
    const innerHeight = height - inset * 2;
    const perimeter =
      2 * (innerWidth - radius * 2) +
      2 * (innerHeight - radius * 2) +
      2 * Math.PI * radius;

    return {
      viewBox: `0 0 ${width} ${height}`,
      path: `
        M ${inset + radius} ${inset}
        H ${width - inset - radius}
        A ${radius} ${radius} 0 0 1 ${width - inset} ${inset + radius}
        V ${height - inset - radius}
        A ${radius} ${radius} 0 0 1 ${width - inset - radius} ${height - inset}
        H ${inset + radius}
        A ${radius} ${radius} 0 0 1 ${inset} ${height - inset - radius}
        V ${inset + radius}
        A ${radius} ${radius} 0 0 1 ${inset + radius} ${inset}
      `,
      length: perimeter,
      strokeWidth: resolvedStrokeWidth,
    };
  }, [shape, strokeWidth]);

  const bodyLength = geometry.length * BODY_LENGTH_RATIO;
  const bodyDashArray = `${bodyLength} ${geometry.length}`;
  const staticDashOffset = geometry.length * (1 - progressRatio);

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={geometry.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={geometry.path}
        fill="none"
        stroke={TRACK_COLOR}
        strokeWidth={geometry.strokeWidth}
        strokeLinecap="round"
      />
      <motion.path
        d={geometry.path}
        fill="none"
        stroke={tailColor}
        strokeWidth={geometry.strokeWidth + 1.6}
        strokeLinecap="round"
        strokeDasharray={bodyDashArray}
        strokeDashoffset={staticDashOffset}
        animate={
          animate
            ? { strokeDashoffset: [geometry.length, 0] }
            : undefined
        }
        transition={
          animate
            ? {
                duration: LOOP_DURATION_SECONDS,
                ease: 'linear',
                repeat: Number.POSITIVE_INFINITY,
              }
            : undefined
        }
      />
      <motion.path
        d={geometry.path}
        fill="none"
        stroke={themeColor}
        strokeWidth={geometry.strokeWidth}
        strokeLinecap="round"
        strokeDasharray={bodyDashArray}
        strokeDashoffset={staticDashOffset}
        animate={
          animate
            ? { strokeDashoffset: [geometry.length, 0] }
            : undefined
        }
        transition={
          animate
            ? {
                duration: LOOP_DURATION_SECONDS,
                ease: 'linear',
                repeat: Number.POSITIVE_INFINITY,
              }
            : undefined
        }
      />
    </svg>
  );
}

function SnakeFrameBase({
  shape,
  loading,
  children,
  className,
  themeColor = DEFAULT_THEME_COLOR,
  previewProgress,
  strokeWidth,
  contentClassName,
}: SnakeLoadingFrameProps & { previewProgress?: number }) {
  const [showOverlay, setShowOverlay] = useState(loading || previewProgress !== undefined);
  const exitTimerRef = useRef<number | null>(null);
  const resolvedStrokeWidth =
    strokeWidth ?? (shape === 'circle' ? DEFAULT_CIRCLE_STROKE : DEFAULT_RECT_STROKE);
  const circleContentInset =
    shape === 'circle' ? Math.max(6, resolvedStrokeWidth + 4) : 0;
  const progressRatio = clampProgress(previewProgress ?? 0) / 100;

  useEffect(() => {
    if (previewProgress !== undefined) {
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
  }, [loading, previewProgress]);

  return (
    <div
      className={cn(
        'relative isolate overflow-hidden',
        shape === 'circle' ? 'rounded-full' : 'rounded-[24px]',
        className,
      )}
    >
      <div
        className={cn(
          'relative z-0',
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
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ opacity: loading || previewProgress !== undefined ? 1 : 0 }}
          transition={{ duration: EXIT_DURATION_MS / 1000, ease: 'easeOut' }}
        >
          <SnakeRingSvg
            shape={shape}
            themeColor={themeColor}
            progressRatio={progressRatio}
            animate={previewProgress === undefined && loading}
            strokeWidth={resolvedStrokeWidth}
          />
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
