'use client';

import type { CSSProperties, DOMAttributes, ReactNode, RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';
import { themeName } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

export type BeamFrameTone = 'theme' | 'rainbow' | 'mono' | 'warm' | 'cool';

export type BeamFrameProps = {
  children: ReactNode;
  active?: boolean;
  interactive?: boolean;
  tone?: BeamFrameTone;
  duration?: number;
  radius?: number;
  className?: string;
};

export type BeamFrameRenderProps = Required<
  Pick<BeamFrameProps, 'active' | 'interactive' | 'tone' | 'duration'>
> &
  Pick<BeamFrameProps, 'children' | 'className' | 'radius'>;

export type FrameSize = {
  width: number;
  height: number;
};

type BeamPalette = {
  a: string;
  b: string;
  c: string;
};

const THEME_PALETTES: Record<string, BeamPalette> = {
  purple: { a: '#AC62FD', b: '#EC4899', c: '#6366F1' },
  orange: { a: '#F97316', b: '#F59E0B', c: '#EF4444' },
  indigo: { a: '#6366F1', b: '#3B82F6', c: '#06B6D4' },
  emerald: { a: '#10B981', b: '#14B8A6', c: '#22C55E' },
  rose: { a: '#F43F5E', b: '#EC4899', c: '#FB7185' },
};

const TONE_PALETTES: Record<Exclude<BeamFrameTone, 'theme'>, BeamPalette> = {
  rainbow: { a: '#FF3D77', b: '#3388FF', c: '#00FF88' },
  mono: { a: '#E5E7EB', b: '#94A3B8', c: '#FFFFFF' },
  warm: { a: '#F97316', b: '#FBBF24', c: '#EF4444' },
  cool: { a: '#06B6D4', b: '#6366F1', c: '#14B8A6' },
};

const BEAM_FRAME_STYLE = {
  ambientGlowOpacity: 0.24,
  beamOpacity: 1.0,
  auraOpacity: 0.86,
  auraLength: 0.08,
  traceLength: 0.42,
  traceWidth: 1.15,
  ambientGlowWidth: 7,
  auraWidth: 8.5,
};

const BASE_BORDER_OPACITY = 0.18;

export const BASE_DURATION_SECONDS = 3.6;
export const DEFAULT_RADIUS = 24;

function getPalette(tone: BeamFrameTone): BeamPalette {
  if (tone !== 'theme') {
    return TONE_PALETTES[tone];
  }

  return THEME_PALETTES[themeName] ?? THEME_PALETTES.purple;
}

export function normalizeDuration(duration: number): number {
  if (!Number.isFinite(duration)) {
    return BASE_DURATION_SECONDS;
  }

  return Math.max(0.4, duration);
}

export function useMeasuredFrameSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<FrameSize>({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return undefined;
    }

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.max(0, rect.width),
        height: Math.max(0, rect.height),
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

export function useInteractiveRunning(active: boolean, interactive: boolean) {
  const [isInteractiveRunning, setIsInteractiveRunning] = useState(false);
  const interactionProps: Pick<
    DOMAttributes<HTMLDivElement>,
    'onBlur' | 'onFocus' | 'onMouseEnter' | 'onMouseLeave'
  > = interactive
    ? {
        onMouseEnter: () => setIsInteractiveRunning(true),
        onMouseLeave: () => setIsInteractiveRunning(false),
        onFocus: () => setIsInteractiveRunning(true),
        onBlur: () => setIsInteractiveRunning(false),
      }
    : {};

  return {
    isRunning: active || isInteractiveRunning,
    interactionProps,
  };
}

function createRootStyle({
  tone,
  radius,
}: Pick<BeamFrameRenderProps, 'tone' | 'radius'>): CSSProperties {
  const palette = getPalette(tone);
  const frameRadius = radius ?? DEFAULT_RADIUS;

  return {
    '--beam-frame-radius': `${frameRadius}px`,
    '--beam-frame-color-a': palette.a,
    '--beam-frame-color-b': palette.b,
    '--beam-frame-color-c': palette.c,
    '--beam-frame-border-opacity': BASE_BORDER_OPACITY,
    '--beam-frame-ambient-glow-opacity': BEAM_FRAME_STYLE.ambientGlowOpacity,
    '--beam-frame-beam-opacity': BEAM_FRAME_STYLE.beamOpacity,
    '--beam-frame-aura-opacity': BEAM_FRAME_STYLE.auraOpacity,
    '--beam-frame-aura-length': BEAM_FRAME_STYLE.auraLength,
    '--beam-frame-aura-dash-pattern':
      'var(--beam-frame-aura-length) calc(1 - var(--beam-frame-aura-length))',
    '--beam-frame-trace-length': BEAM_FRAME_STYLE.traceLength,
    '--beam-frame-trace-dash-pattern':
      'var(--beam-frame-trace-length) calc(1 - var(--beam-frame-trace-length))',
    '--beam-frame-trace-width': BEAM_FRAME_STYLE.traceWidth,
    '--beam-frame-ambient-glow-width': BEAM_FRAME_STYLE.ambientGlowWidth,
    '--beam-frame-aura-width': BEAM_FRAME_STYLE.auraWidth,
  } as CSSProperties;
}

export function BeamFrameShell({
  children,
  className,
  tone,
  radius,
  isRunning,
  interactionProps,
  renderBeam,
  rootRef,
}: BeamFrameRenderProps & {
  isRunning: boolean;
  interactionProps: Pick<
    DOMAttributes<HTMLDivElement>,
    'onBlur' | 'onFocus' | 'onMouseEnter' | 'onMouseLeave'
  >;
  renderBeam: () => ReactNode;
  rootRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={rootRef}
      className={cn(
        'group/beam-frame relative isolate overflow-hidden rounded-(--beam-frame-radius) p-px',
        className,
      )}
      data-beam-running={isRunning ? 'true' : 'false'}
      style={createRootStyle({ tone, radius })}
      {...interactionProps}
    >
      {renderBeam()}
      <div className="relative z-10 rounded-[calc(var(--beam-frame-radius)-1px)]">
        {children}
      </div>
    </div>
  );
}

export function createBeamGeometry({
  radius,
  size,
}: {
  radius?: number;
  size: FrameSize;
}) {
  const strokeWidth = 3;
  const width = Math.max(1, size.width);
  const height = Math.max(1, size.height);
  const rectOffset = strokeWidth / 2;
  const rectWidth = Math.max(1, width - strokeWidth);
  const rectHeight = Math.max(1, height - strokeWidth);
  const rectRadius = Math.max(0, Math.min(radius ?? DEFAULT_RADIUS, rectWidth / 2, rectHeight / 2));
  const rectRight = rectOffset + rectWidth;
  const rectBottom = rectOffset + rectHeight;
  const roundedPathLap = [
    `H ${rectRight - rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectRight} ${rectOffset + rectRadius}`,
    `V ${rectBottom - rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectRight - rectRadius} ${rectBottom}`,
    `H ${rectOffset + rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectOffset} ${rectBottom - rectRadius}`,
    `V ${rectOffset + rectRadius}`,
    `A ${rectRadius} ${rectRadius} 0 0 1 ${rectOffset + rectRadius} ${rectOffset}`,
  ].join(' ');
  const extendedRoundedPath = `M ${rectOffset + rectRadius} ${rectOffset} ${roundedPathLap} ${roundedPathLap}`;

  return {
    width,
    height,
    rectOffset,
    rectWidth,
    rectHeight,
    rectRadius,
    rectRight,
    rectBottom,
    extendedRoundedPath,
  };
}

export function BeamSvgLayer({
  beamRef,
  auraGradientId,
  softGlowFilterId,
  radius,
  size,
}: {
  beamRef: RefObject<SVGGElement | null>;
  auraGradientId: string;
  softGlowFilterId: string;
  radius?: number;
  size: FrameSize;
}) {
  const {
    width,
    height,
    rectOffset,
    rectWidth,
    rectHeight,
    rectRadius,
    rectRight,
    rectBottom,
    extendedRoundedPath,
  } = createBeamGeometry({
    radius,
    size,
  });

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
    >
      <g ref={beamRef} opacity="0" style={{ mixBlendMode: 'plus-lighter' }}>
        <rect
          x={rectOffset}
          y={rectOffset}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          ry={rectRadius}
          pathLength="1"
          fill="none"
          stroke={`url(#${auraGradientId})`}
          strokeLinecap="round"
          strokeWidth="var(--beam-frame-ambient-glow-width)"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${softGlowFilterId})`}
          opacity="var(--beam-frame-ambient-glow-opacity)"
        />
        <path
          d={extendedRoundedPath}
          pathLength="2"
          fill="none"
          stroke={`url(#${auraGradientId})`}
          strokeLinecap="round"
          strokeWidth="var(--beam-frame-aura-width)"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${softGlowFilterId})`}
          style={{
            strokeDasharray: 'var(--beam-frame-aura-dash-pattern)',
          }}
          opacity="var(--beam-frame-aura-opacity)"
        />
        <path
          d={extendedRoundedPath}
          pathLength="2"
          fill="none"
          stroke={`url(#${auraGradientId})`}
          strokeLinecap="round"
          strokeWidth="var(--beam-frame-trace-width)"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 'var(--beam-frame-trace-dash-pattern)',
          }}
          opacity="var(--beam-frame-beam-opacity)"
        />
      </g>
      <defs>
        <filter id={softGlowFilterId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <linearGradient
          id={auraGradientId}
          x1={rectOffset}
          x2={rectRight}
          y1={rectOffset}
          y2={rectBottom}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--beam-frame-color-a)" stopOpacity="0.58" />
          <stop offset="22%" stopColor="var(--beam-frame-color-b)" stopOpacity="0.78" />
          <stop offset="44%" stopColor="var(--beam-frame-color-c)" stopOpacity="0.96" />
          <stop offset="58%" stopColor="var(--beam-frame-color-b)" stopOpacity="1" />
          <stop offset="78%" stopColor="var(--beam-frame-color-a)" stopOpacity="0.82" />
          <stop offset="100%" stopColor="var(--beam-frame-color-c)" stopOpacity="0.58" />
        </linearGradient>
      </defs>
    </svg>
  );
}
