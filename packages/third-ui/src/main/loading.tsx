'use client';

import { cn } from '@windrun-huaiin/lib/utils';
import { themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';

const NUM_ROWS = 15;
const NUM_COLS = 15;
const DOT_SIZE = 6; // px, dot diameter
const SPACING = 12; // px, space between dot centers
const ANIMATION_DURATION = 1.8; // seconds
const STAGGER_DELAY_FACTOR = 0.08; // seconds, delay per unit of distance from center

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
}

export function Loading({
  themeColor = themeSvgIconColor,
  compact = false,
  className,
  label = 'Loading...',
  labelClassName,
}: LoadingProps = {}) {
  const colors = createLoadingPalette(themeColor);
  const dots = [];
  const centerX = (NUM_COLS - 1) / 2;
  const centerY = (NUM_ROWS - 1) / 2;

  for (let i = 0; i < NUM_ROWS; i++) {
    for (let j = 0; j < NUM_COLS; j++) {
      // Calculate distance from the center of the grid
      const distance = Math.sqrt(Math.pow(i - centerY, 2) + Math.pow(j - centerX, 2));
      dots.push({
        id: `${i}-${j}`,
        row: i,
        col: j,
        // Animation delay based on distance, creating a ripple effect
        delay: distance * STAGGER_DELAY_FACTOR,
        // Color selection based on distance rings
        color: colors[Math.floor(distance) % colors.length],
      });
    }
  }

  // Calculate the total width and height of the dot container
  const containerWidth = (NUM_COLS - 1) * SPACING + DOT_SIZE;
  const containerHeight = (NUM_ROWS - 1) * SPACING + DOT_SIZE;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900',
        compact ? 'min-h-[250px] rounded-[28px] px-4 py-2' : 'min-h-screen',
        className
      )}
    >
      <div
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
            style={{
              position: 'absolute',
              left: dot.col * SPACING,
              top: dot.row * SPACING,
              width: DOT_SIZE,
              height: DOT_SIZE,
              backgroundColor: dot.color,
              borderRadius: '50%',
              animationName: 'loading-dot-pulse',
              animationDuration: `${ANIMATION_DURATION}s`,
              animationTimingFunction: 'cubic-bezier(0.45, 0, 0.55, 1)',
              animationIterationCount: 'infinite',
              animationDelay: `${dot.delay}s`,
              opacity: 0,
              transform: 'scale(0)',
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
