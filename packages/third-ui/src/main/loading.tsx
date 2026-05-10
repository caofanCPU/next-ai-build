'use client';

import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';
import { animate, type JSAnimation } from 'animejs';

const NUM_ROWS = 15;
const NUM_COLS = 15;
const DOT_SIZE = 6; // px, dot diameter
const SPACING = 12; // px, space between dot centers
const ANIMATION_DURATION = 1.8; // seconds
const STAGGER_DELAY_FACTOR = 0.08; // seconds, delay per unit of distance from center

export function getLoadingCycleDurationMs() {
  const centerX = (NUM_COLS - 1) / 2;
  const centerY = (NUM_ROWS - 1) / 2;
  const furthestDistance = Math.sqrt(Math.pow(centerY, 2) + Math.pow(centerX, 2));

  return (ANIMATION_DURATION + furthestDistance * STAGGER_DELAY_FACTOR) * 1000;
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const fullHex = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    return { r: 172, g: 98, b: 253 };
  }

  return {
    r: Number.parseInt(fullHex.slice(0, 2), 16),
    g: Number.parseInt(fullHex.slice(2, 4), 16),
    b: Number.parseInt(fullHex.slice(4, 6), 16),
  };
}

function shiftColor(hex: string, offset: { r?: number; g?: number; b?: number }) {
  const { r, g, b } = hexToRgb(hex);

  return `rgb(${clampChannel(r + (offset.r ?? 0))}, ${clampChannel(g + (offset.g ?? 0))}, ${clampChannel(b + (offset.b ?? 0))})`;
}

function createLoadingPalette(baseHex: string) {
  return [
    shiftColor(baseHex, { r: 0, g: 0, b: 0 }),
    shiftColor(baseHex, { r: 18, g: -10, b: 22 }),
    shiftColor(baseHex, { r: 32, g: -18, b: 30 }),
    shiftColor(baseHex, { r: 54, g: -30, b: 8 }),
    shiftColor(baseHex, { r: 28, g: 4, b: 10 }),
    shiftColor(baseHex, { r: 16, g: -6, b: 26 }),
    shiftColor(baseHex, { r: 6, g: 14, b: -12 }),
    shiftColor(baseHex, { r: -10, g: 8, b: 16 }),
    shiftColor(baseHex, { r: -18, g: -6, b: 24 }),
    shiftColor(baseHex, { r: -24, g: -14, b: 6 }),
  ];
}

interface LoadingProps {
  themeColor?: string;
  compact?: boolean;
  className?: string;
  label?: string;
  labelClassName?: string;
  paused?: boolean;
}

export function Loading({
  themeColor = themeSvgIconColor,
  compact = false,
  className,
  label = 'Loading...',
  labelClassName,
  paused = false,
}: LoadingProps = {}) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<JSAnimation | null>(null);
  const pausedRef = useRef(paused);
  const colors = useMemo(() => createLoadingPalette(themeColor), [themeColor]);
  const centerX = (NUM_COLS - 1) / 2;
  const centerY = (NUM_ROWS - 1) / 2;
  const dots = useMemo(() => {
    const nextDots = [];

    for (let i = 0; i < NUM_ROWS; i++) {
      for (let j = 0; j < NUM_COLS; j++) {
        const distance = Math.sqrt(Math.pow(i - centerY, 2) + Math.pow(j - centerX, 2));
        nextDots.push({
          id: `${i}-${j}`,
          row: i,
          col: j,
          delay: distance * STAGGER_DELAY_FACTOR,
          color: colors[Math.floor(distance) % colors.length],
        });
      }
    }

    return nextDots;
  }, [centerX, centerY, colors]);

  // Calculate the total width and height of the dot container
  const containerWidth = (NUM_COLS - 1) * SPACING + DOT_SIZE;
  const containerHeight = (NUM_ROWS - 1) * SPACING + DOT_SIZE;

  pausedRef.current = paused;

  useEffect(() => {
    const grid = gridRef.current;

    if (!grid) {
      return undefined;
    }

    const dotNodes = Array.from(grid.querySelectorAll<HTMLElement>('[data-loading-dot]'));

    animationRef.current?.revert();
    animationRef.current = animate(dotNodes, {
      opacity: [0, 1, 0.7, 0],
      scale: [0.2, 1.2, 0.8, 0.2],
      duration: ANIMATION_DURATION * 1000,
      delay: (target?: unknown) => Number((target as HTMLElement | undefined)?.dataset.loadingDelay ?? 0) * 1000,
      ease: 'inOutSine',
      loop: true,
    });

    if (pausedRef.current) {
      animationRef.current.pause();
    }

    return () => {
      animationRef.current?.revert();
      animationRef.current = null;
    };
  }, [dots]);

  useEffect(() => {
    const animation = animationRef.current;

    if (!animation) {
      return;
    }

    if (paused) {
      animation.pause();
    } else {
      animation.play();
    }
  }, [paused]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900',
        compact ? 'min-h-[250px] rounded-[28px] px-4 py-2' : 'min-h-screen',
        className
      )}
    >
      <div
        ref={gridRef}
        style={{
          width: containerWidth,
          height: containerHeight,
          position: 'relative',
          borderRadius: '50%', // Make the container circular
          overflow: 'hidden',   // Clip dots outside the circle
        }}
      >
        {dots.map(dot => (
          <div
            key={dot.id}
            data-loading-dot=""
            data-loading-delay={dot.delay}
            style={{
              position: 'absolute',
              left: dot.col * SPACING,
              top: dot.row * SPACING,
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: dot.color,
              borderRadius: '50%',
              opacity: 0.35,
              transform: 'scale(0.2)',
            }}
          />
        ))}
        {/* Centered Loading Text */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }} // So text doesn't interfere with potential mouse events on dots if any
        >
          <p className={cn('text-xl font-semibold text-white', labelClassName)}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
} 
