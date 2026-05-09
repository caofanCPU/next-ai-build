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
  rainbow: { a: '#22D3EE', b: '#A855F7', c: '#F97316' },
  mono: { a: '#E5E7EB', b: '#94A3B8', c: '#FFFFFF' },
  warm: { a: '#F97316', b: '#FBBF24', c: '#EF4444' },
  cool: { a: '#06B6D4', b: '#6366F1', c: '#14B8A6' },
};

const BEAM_FRAME_STYLE = {
  beamOpacity: 0.86,
  glowOpacity: 0.18,
  coreOpacity: 0.36,
  auraOpacity: 0.12,
  beamLength: 0.24,
  coreLength: 0.3,
  auraLength: 0.38,
  beamWidth: 2.2,
  glowWidth: 5,
  haloWidth: 7,
  auraWidth: 12,
};

const BASE_BORDER_OPACITY = 0.18;

export const BASE_DURATION_SECONDS = 1.8;
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
  const svgRadius = Math.max(0, Math.min(49, frameRadius));

  return {
    '--beam-frame-radius': `${frameRadius}px`,
    '--beam-frame-svg-radius': svgRadius,
    '--beam-frame-color-a': palette.a,
    '--beam-frame-color-b': palette.b,
    '--beam-frame-color-c': palette.c,
    '--beam-frame-border-opacity': BASE_BORDER_OPACITY,
    '--beam-frame-beam-opacity': BEAM_FRAME_STYLE.beamOpacity,
    '--beam-frame-glow-opacity': BEAM_FRAME_STYLE.glowOpacity,
    '--beam-frame-core-opacity': BEAM_FRAME_STYLE.coreOpacity,
    '--beam-frame-aura-opacity': BEAM_FRAME_STYLE.auraOpacity,
    '--beam-frame-beam-length': BEAM_FRAME_STYLE.beamLength,
    '--beam-frame-core-length': BEAM_FRAME_STYLE.coreLength,
    '--beam-frame-aura-length': BEAM_FRAME_STYLE.auraLength,
    '--beam-frame-beam-width': BEAM_FRAME_STYLE.beamWidth,
    '--beam-frame-glow-width': BEAM_FRAME_STYLE.glowWidth,
    '--beam-frame-halo-width': BEAM_FRAME_STYLE.haloWidth,
    '--beam-frame-aura-width': BEAM_FRAME_STYLE.auraWidth,
  } as CSSProperties;
}

function createBaseBorderBackground() {
  return 'rgba(148, 163, 184, var(--beam-frame-border-opacity))';
}

function createBorderRingMask(): CSSProperties {
  return {
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    padding: '1px',
  };
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
        'group/beam-frame relative isolate overflow-hidden rounded-[var(--beam-frame-radius)] p-px',
        className,
      )}
      data-beam-running={isRunning ? 'true' : 'false'}
      style={createRootStyle({ tone, radius })}
      {...interactionProps}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
        style={{
          background: createBaseBorderBackground(),
          ...createBorderRingMask(),
        }}
      />
      {renderBeam()}
      <div className="relative z-10 rounded-[calc(var(--beam-frame-radius)-1px)]">{children}</div>
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

  return {
    width,
    height,
    rectOffset,
    rectWidth,
    rectHeight,
    rectRadius,
  };
}

export function BeamSvgLayer({
  beamRef,
  auraGradientId,
  gradientId,
  haloGradientId,
  softGlowFilterId,
  radius,
  size,
}: {
  beamRef: RefObject<SVGGElement | null>;
  auraGradientId: string;
  gradientId: string;
  haloGradientId: string;
  softGlowFilterId: string;
  radius?: number;
  size: FrameSize;
}) {
  const { width, height, rectOffset, rectWidth, rectHeight, rectRadius } = createBeamGeometry({
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
      <g ref={beamRef} opacity="0">
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
          strokeWidth="var(--beam-frame-aura-width)"
          vectorEffect="non-scaling-stroke"
          filter={`url(#${softGlowFilterId})`}
          style={{
            strokeDasharray:
              'var(--beam-frame-aura-length) calc(1 - var(--beam-frame-aura-length))',
          }}
          opacity="var(--beam-frame-aura-opacity)"
        />
        <rect
          x={rectOffset}
          y={rectOffset}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          ry={rectRadius}
          pathLength="1"
          fill="none"
          stroke={`url(#${haloGradientId})`}
          strokeLinecap="round"
          strokeWidth="var(--beam-frame-halo-width)"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray:
              'var(--beam-frame-aura-length) calc(1 - var(--beam-frame-aura-length))',
          }}
          opacity="var(--beam-frame-glow-opacity)"
        />
        <rect
          x={rectOffset}
          y={rectOffset}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          ry={rectRadius}
          pathLength="1"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth="var(--beam-frame-glow-width)"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray:
              'var(--beam-frame-core-length) calc(1 - var(--beam-frame-core-length))',
          }}
          opacity="var(--beam-frame-core-opacity)"
        />
        <rect
          x={rectOffset}
          y={rectOffset}
          width={rectWidth}
          height={rectHeight}
          rx={rectRadius}
          ry={rectRadius}
          pathLength="1"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth="var(--beam-frame-beam-width)"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: 'var(--beam-frame-beam-length) calc(1 - var(--beam-frame-beam-length))',
          }}
        />
      </g>
      <defs>
        <filter id={softGlowFilterId} x="-12%" y="-12%" width="124%" height="124%">
          <feGaussianBlur stdDeviation="2.25" />
        </filter>
        <linearGradient id={auraGradientId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="var(--beam-frame-color-a)" stopOpacity="0" />
          <stop offset="18%" stopColor="var(--beam-frame-color-b)" stopOpacity="0.28" />
          <stop offset="42%" stopColor="var(--beam-frame-color-c)" stopOpacity="0.76" />
          <stop offset="58%" stopColor="white" stopOpacity="0.48" />
          <stop offset="78%" stopColor="var(--beam-frame-color-a)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--beam-frame-color-b)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={haloGradientId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="var(--beam-frame-color-a)" stopOpacity="0" />
          <stop offset="22%" stopColor="var(--beam-frame-color-b)" stopOpacity="0.42" />
          <stop offset="48%" stopColor="var(--beam-frame-color-c)" stopOpacity="0.94" />
          <stop offset="62%" stopColor="white" stopOpacity="0.58" />
          <stop offset="80%" stopColor="var(--beam-frame-color-a)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--beam-frame-color-b)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="var(--beam-frame-color-a)" stopOpacity="0.18" />
          <stop offset="26%" stopColor="var(--beam-frame-color-b)" stopOpacity="0.82" />
          <stop offset="46%" stopColor="white" stopOpacity="1" />
          <stop offset="56%" stopColor="var(--beam-frame-color-c)" stopOpacity="1" />
          <stop offset="74%" stopColor="var(--beam-frame-color-a)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--beam-frame-color-c)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}
