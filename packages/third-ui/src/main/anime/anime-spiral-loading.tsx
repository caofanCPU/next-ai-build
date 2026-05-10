'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createTimeline, stagger, type Timeline, utils } from 'animejs';
import { cn } from '@windrun-huaiin/lib/utils';

const DEFAULT_DOT_COUNT = 2024;
const DEFAULT_DURATION = 10000;
const DEFAULT_DISTANCE_REM = 20;
const DEFAULT_DOT_SIZE_EM = 1;
const DEFAULT_FONT_SIZE = 20;

export interface AnimeSpiralLoadingProps {
  className?: string;
  dotCount?: number;
  duration?: number;
  distanceRem?: number;
  dotSizeEm?: number;
  fontSize?: number;
  paused?: boolean;
}

export function AnimeSpiralLoading({
  className,
  dotCount = DEFAULT_DOT_COUNT,
  duration = DEFAULT_DURATION,
  distanceRem = DEFAULT_DISTANCE_REM,
  dotSizeEm = DEFAULT_DOT_SIZE_EM,
  fontSize = DEFAULT_FONT_SIZE,
  paused = false,
}: AnimeSpiralLoadingProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const pausedRef = useRef(paused);
  const safeDotCount = Math.max(1, Math.floor(dotCount));
  const safeDuration = Math.max(1, duration);
  const angle = useMemo(
    () => (index: number) => utils.mapRange(index, 0, safeDotCount, 0, Math.PI * 100),
    [safeDotCount]
  );
  const dots = useMemo(
    () => Array.from({ length: safeDotCount }, (_, index) => {
      const hue = utils.round((360 / safeDotCount) * index, 0);

      return {
        id: index,
        background: `hsl(${hue}, 60%, 60%)`,
      };
    }),
    [safeDotCount]
  );

  pausedRef.current = paused;

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return undefined;
    }

    const dotNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-anime-spiral-dot]'));

    timelineRef.current?.revert();
    timelineRef.current = createTimeline()
      .add(dotNodes, {
        x: (_target: unknown, i: number) => `${Math.sin(angle(i)) * distanceRem}rem`,
        y: (_target: unknown, i: number) => `${Math.cos(angle(i)) * distanceRem}rem`,
        scale: [0, 0.4, 0.2, 0.9, 0],
        playbackEase: 'inOutSine',
        loop: true,
        duration: safeDuration,
      }, stagger([0, safeDuration]))
      .init()
      .seek(safeDuration);

    if (pausedRef.current) {
      timelineRef.current.pause();
    }

    return () => {
      timelineRef.current?.revert();
      timelineRef.current = null;
    };
  }, [angle, distanceRem, safeDuration, dots]);

  useEffect(() => {
    const timeline = timelineRef.current;

    if (!timeline) {
      return;
    }

    if (paused) {
      timeline.pause();
    } else {
      timeline.play();
    }
  }, [paused]);

  return (
    <div
      ref={rootRef}
      className={cn('relative h-dvh w-full overflow-hidden', className)}
      style={{ fontSize }}
      aria-hidden="true"
    >
      {dots.map(dot => (
        <div
          key={dot.id}
          data-anime-spiral-dot=""
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: `${dotSizeEm}em`,
            height: `${dotSizeEm}em`,
            margin: `${dotSizeEm / -2}em 0 0 ${dotSizeEm / -2}em`,
            backgroundColor: dot.background,
          }}
        />
      ))}
    </div>
  );
}
