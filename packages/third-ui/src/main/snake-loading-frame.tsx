'use client';

import type { ReactNode, RefObject } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
const DEFAULT_CIRCLE_STROKE = 0.5;
const DEFAULT_RECT_STROKE = 1;
const MIN_FRAME_SIZE = 2;
const MIN_BODY_LENGTH = 24;
const MAX_BODY_LENGTH_RATIO = 0.36;
const RECT_MIN_STROKE_WIDTH = 1;

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

function createHeadGlowColor(themeColor: string): string {
  const rgb = hexToRgb(themeColor);

  if (!rgb) {
    return 'rgba(59, 130, 246, 0.94)';
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.94)`;
}

function createSweepTailColor(themeColor: string): string {
  const rgb = hexToRgb(themeColor);

  if (!rgb) {
    return 'rgba(59, 130, 246, 0.32)';
  }

  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.32)`;
}

interface CornerRadius {
  x: number;
  y: number;
}

interface RectRadii {
  topLeft: CornerRadius;
  topRight: CornerRadius;
  bottomRight: CornerRadius;
  bottomLeft: CornerRadius;
}

interface RingGeometry {
  viewBox: string;
  path: string;
  length: number;
  strokeWidth: number;
}

function parseRadiusValue(value: string): CornerRadius {
  const parts = value
    .split(/\s+/)
    .map((part) => Number.parseFloat(part))
    .filter((part) => Number.isFinite(part));

  if (parts.length === 0) {
    return { x: 0, y: 0 };
  }

  if (parts.length === 1) {
    return { x: parts[0], y: parts[0] };
  }

  return { x: parts[0], y: parts[1] };
}

function clampCornerRadius(
  radius: CornerRadius,
  maxX: number,
  maxY: number,
): CornerRadius {
  return {
    x: Math.max(0, Math.min(radius.x, maxX)),
    y: Math.max(0, Math.min(radius.y, maxY)),
  };
}

function scaleHorizontalPair(
  start: CornerRadius,
  end: CornerRadius,
  limit: number,
): [CornerRadius, CornerRadius] {
  const sum = start.x + end.x;

  if (sum <= limit || sum === 0) {
    return [start, end];
  }

  const scale = limit / sum;

  return [
    { ...start, x: start.x * scale },
    { ...end, x: end.x * scale },
  ];
}

function scaleVerticalPair(
  start: CornerRadius,
  end: CornerRadius,
  limit: number,
): [CornerRadius, CornerRadius] {
  const sum = start.y + end.y;

  if (sum <= limit || sum === 0) {
    return [start, end];
  }

  const scale = limit / sum;

  return [
    { ...start, y: start.y * scale },
    { ...end, y: end.y * scale },
  ];
}

function normalizeRectRadii(
  width: number,
  height: number,
  input: RectRadii,
): RectRadii {
  let topLeft = clampCornerRadius(input.topLeft, width / 2, height / 2);
  let topRight = clampCornerRadius(input.topRight, width / 2, height / 2);
  let bottomRight = clampCornerRadius(input.bottomRight, width / 2, height / 2);
  let bottomLeft = clampCornerRadius(input.bottomLeft, width / 2, height / 2);

  [topLeft, topRight] = scaleHorizontalPair(topLeft, topRight, width);
  [bottomLeft, bottomRight] = scaleHorizontalPair(bottomLeft, bottomRight, width);
  [topLeft, bottomLeft] = scaleVerticalPair(topLeft, bottomLeft, height);
  [topRight, bottomRight] = scaleVerticalPair(topRight, bottomRight, height);

  return {
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  };
}

function buildRoundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radii: RectRadii,
): string {
  const { topLeft, topRight, bottomRight, bottomLeft } = normalizeRectRadii(
    width,
    height,
    radii,
  );

  return [
    `M ${x + topLeft.x} ${y}`,
    `H ${x + Math.max(topLeft.x, width - topRight.x)}`,
    topRight.x > 0 || topRight.y > 0
      ? `A ${topRight.x} ${topRight.y} 0 0 1 ${x + width} ${y + topRight.y}`
      : `L ${x + width} ${y}`,
    `V ${y + Math.max(topRight.y, height - bottomRight.y)}`,
    bottomRight.x > 0 || bottomRight.y > 0
      ? `A ${bottomRight.x} ${bottomRight.y} 0 0 1 ${x + width - bottomRight.x} ${y + height}`
      : `L ${x + width} ${y + height}`,
    `H ${x + Math.min(width - bottomRight.x, bottomLeft.x)}`,
    bottomLeft.x > 0 || bottomLeft.y > 0
      ? `A ${bottomLeft.x} ${bottomLeft.y} 0 0 1 ${x} ${y + height - bottomLeft.y}`
      : `L ${x} ${y + height}`,
    `V ${y + Math.min(height - bottomLeft.y, topLeft.y)}`,
    topLeft.x > 0 || topLeft.y > 0
      ? `A ${topLeft.x} ${topLeft.y} 0 0 1 ${x + topLeft.x} ${y}`
      : `L ${x} ${y}`,
    'Z',
  ].join(' ');
}

function createCircleGeometry(
  width: number,
  height: number,
  strokeWidth: number,
): RingGeometry {
  const safeWidth = Math.max(width, MIN_FRAME_SIZE);
  const safeHeight = Math.max(height, MIN_FRAME_SIZE);
  const radius = Math.max(0, Math.min(safeWidth, safeHeight) / 2 - strokeWidth / 2);
  const centerX = safeWidth / 2;
  const centerY = safeHeight / 2;

  return {
    viewBox: `0 0 ${safeWidth} ${safeHeight}`,
    path: `M ${centerX} ${centerY - radius} A ${radius} ${radius} 0 1 1 ${centerX} ${
      centerY + radius
    } A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius}`,
    length: Math.max(0, 2 * Math.PI * radius),
    strokeWidth,
  };
}

function createRoundedRectGeometry(
  width: number,
  height: number,
  strokeWidth: number,
  radii: RectRadii,
): RingGeometry {
  const safeWidth = Math.max(width, MIN_FRAME_SIZE);
  const safeHeight = Math.max(height, MIN_FRAME_SIZE);
  const inset = strokeWidth / 2;
  const innerWidth = Math.max(safeWidth - strokeWidth, MIN_FRAME_SIZE);
  const innerHeight = Math.max(safeHeight - strokeWidth, MIN_FRAME_SIZE);
  const adjustedRadii = normalizeRectRadii(innerWidth, innerHeight, {
    topLeft: {
      x: Math.max(0, radii.topLeft.x - inset),
      y: Math.max(0, radii.topLeft.y - inset),
    },
    topRight: {
      x: Math.max(0, radii.topRight.x - inset),
      y: Math.max(0, radii.topRight.y - inset),
    },
    bottomRight: {
      x: Math.max(0, radii.bottomRight.x - inset),
      y: Math.max(0, radii.bottomRight.y - inset),
    },
    bottomLeft: {
      x: Math.max(0, radii.bottomLeft.x - inset),
      y: Math.max(0, radii.bottomLeft.y - inset),
    },
  });

  return {
    viewBox: `0 0 ${safeWidth} ${safeHeight}`,
    path: buildRoundedRectPath(inset, inset, innerWidth, innerHeight, adjustedRadii),
    length: 0,
    strokeWidth,
  };
}

function readRectRadii(element: HTMLElement): RectRadii {
  const computedStyle = window.getComputedStyle(element);

  return {
    topLeft: parseRadiusValue(computedStyle.borderTopLeftRadius),
    topRight: parseRadiusValue(computedStyle.borderTopRightRadius),
    bottomRight: parseRadiusValue(computedStyle.borderBottomRightRadius),
    bottomLeft: parseRadiusValue(computedStyle.borderBottomLeftRadius),
  };
}

function SnakeRingSvg({
  containerRef,
  shape,
  themeColor,
  progressRatio,
  animate,
  strokeWidth,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  shape: SnakeShape;
  themeColor: string;
  progressRatio: number;
  animate: boolean;
  strokeWidth?: number;
}) {
  const gradientId = useId().replace(/:/g, '-');
  const tailColor = createBodyTailColor(themeColor);
  const headGlowColor = createHeadGlowColor(themeColor);
  const sweepTailColor = createSweepTailColor(themeColor);
  const [geometry, setGeometry] = useState<RingGeometry | null>(null);
  const pathMeasureRef = useRef<SVGPathElement | null>(null);
  const measuredLengthRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateGeometry = () => {
      const rect = container.getBoundingClientRect();
      const preferredStrokeWidth =
        strokeWidth ?? (shape === 'circle' ? DEFAULT_CIRCLE_STROKE : DEFAULT_RECT_STROKE);
      const resolvedStrokeWidth =
        shape === 'rounded-rect'
          ? Math.max(RECT_MIN_STROKE_WIDTH, preferredStrokeWidth)
          : preferredStrokeWidth;
      const nextGeometry =
        shape === 'circle'
          ? createCircleGeometry(rect.width, rect.height, resolvedStrokeWidth)
          : createRoundedRectGeometry(
              rect.width,
              rect.height,
              resolvedStrokeWidth,
              readRectRadii(container),
            );

      measuredLengthRef.current = 0;
      setGeometry(nextGeometry);
    };

    updateGeometry();

    const resizeObserver = new ResizeObserver(() => {
      updateGeometry();
    });
    const mutationObserver = new MutationObserver(() => {
      updateGeometry();
    });

    resizeObserver.observe(container);
    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [containerRef, shape, strokeWidth]);

  useEffect(() => {
    if (!geometry || shape === 'circle' || !pathMeasureRef.current) {
      return;
    }

    const measuredLength = pathMeasureRef.current.getTotalLength();
    const normalizedLength = Number.isFinite(measuredLength)
      ? Math.max(0, measuredLength)
      : 0;

    if (normalizedLength <= 0) {
      return;
    }

    if (Math.abs(measuredLengthRef.current - normalizedLength) < 0.1) {
      return;
    }

    measuredLengthRef.current = normalizedLength;

    setGeometry((current) => {
      if (!current || current.path !== geometry.path) {
        return current;
      }

      if (Math.abs(current.length - normalizedLength) < 0.1) {
        return current;
      }

      return {
        ...current,
        length: normalizedLength,
      };
    });
  }, [geometry, shape]);

  const resolvedGeometry = useMemo(() => geometry, [geometry]);

  if (!resolvedGeometry) {
    return null;
  }

  const effectiveLength =
    resolvedGeometry.length > 0
      ? resolvedGeometry.length
      : Math.max(
          1,
          2 * Math.max(0, resolvedGeometry.strokeWidth),
          2 *
            (Math.max(0, Number.parseFloat(resolvedGeometry.viewBox.split(' ')[2] ?? '0')) +
              Math.max(0, Number.parseFloat(resolvedGeometry.viewBox.split(' ')[3] ?? '0'))),
        );
  const [, , viewBoxWidthRaw, viewBoxHeightRaw] = resolvedGeometry.viewBox.split(' ');
  const viewBoxWidth = Math.max(0, Number.parseFloat(viewBoxWidthRaw ?? '0'));
  const viewBoxHeight = Math.max(0, Number.parseFloat(viewBoxHeightRaw ?? '0'));
  const centerX = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;
  const isCircle = shape === 'circle';
  const tailTransparentStart = isCircle ? '18%' : '26%';
  const tailColorStart = isCircle ? '39%' : '46%';
  const tailTransparentEnd = isCircle ? '90%' : '82%';
  const headTransparentStart = isCircle ? '32%' : '40%';
  const headColorStart = isCircle ? '48%' : '53%';
  const headTransparentEnd = isCircle ? '82%' : '73%';
  const bodyLength = Math.min(
    effectiveLength * MAX_BODY_LENGTH_RATIO,
    Math.max(MIN_BODY_LENGTH, effectiveLength * BODY_LENGTH_RATIO),
  );
  const bodyDashArray = `${bodyLength} ${effectiveLength}`;
  const staticDashOffset = effectiveLength * (1 - progressRatio);
  const tailStrokeWidth =
    shape === 'circle'
      ? resolvedGeometry.strokeWidth + 1.2
      : resolvedGeometry.strokeWidth + Math.min(1.2, resolvedGeometry.strokeWidth * 0.32);

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={resolvedGeometry.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {shape === 'rounded-rect' ? (
        <path ref={pathMeasureRef} d={resolvedGeometry.path} fill="none" stroke="transparent" />
      ) : null}
      {animate ? (
        <defs>
          <linearGradient
            id={`${gradientId}-sweep-tail`}
            x1="0"
            y1="0"
            x2={String(viewBoxWidth)}
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="transparent" />
            <stop offset={tailTransparentStart} stopColor="transparent" />
            <stop offset={tailColorStart} stopColor={sweepTailColor} />
            <stop offset="64%" stopColor={headGlowColor} />
            <stop offset={tailTransparentEnd} stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from={`0 ${centerX} ${centerY}`}
              to={`360 ${centerX} ${centerY}`}
              dur={`${LOOP_DURATION_SECONDS}s`}
              repeatCount="indefinite"
            />
          </linearGradient>
          <linearGradient
            id={`${gradientId}-sweep-head`}
            x1="0"
            y1="0"
            x2={String(viewBoxWidth)}
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="transparent" />
            <stop offset={headTransparentStart} stopColor="transparent" />
            <stop offset={headColorStart} stopColor={themeColor} />
            <stop offset="63%" stopColor={headGlowColor} />
            <stop offset={headTransparentEnd} stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
            <animateTransform
              attributeName="gradientTransform"
              type="rotate"
              from={`0 ${centerX} ${centerY}`}
              to={`360 ${centerX} ${centerY}`}
              dur={`${LOOP_DURATION_SECONDS}s`}
              repeatCount="indefinite"
            />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d={resolvedGeometry.path}
        fill="none"
        stroke={TRACK_COLOR}
        strokeWidth={resolvedGeometry.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {animate ? (
        <>
          <path
            d={resolvedGeometry.path}
            fill="none"
            stroke={`url(#${gradientId}-sweep-tail)`}
            strokeWidth={tailStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={resolvedGeometry.path}
            fill="none"
            stroke={`url(#${gradientId}-sweep-head)`}
            strokeWidth={resolvedGeometry.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}
      {!animate ? (
        <path
          d={resolvedGeometry.path}
          fill="none"
          stroke={themeColor}
          strokeWidth={resolvedGeometry.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={bodyDashArray}
          strokeDashoffset={staticDashOffset}
        />
      ) : null}
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
  const containerRef = useRef<HTMLDivElement | null>(null);
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
          animate={{ opacity: loading || previewProgress !== undefined ? 1 : 0 }}
          transition={{ duration: EXIT_DURATION_MS / 1000, ease: 'easeOut' }}
        >
          <SnakeRingSvg
            containerRef={containerRef}
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
