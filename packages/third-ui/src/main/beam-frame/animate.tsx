'use client';

import { useEffect, useId, useRef } from 'react';
import { type WAAPIAnimation, waapi } from 'animejs';
import { useReducedMotion } from 'motion/react';
import {
  BASE_DURATION_SECONDS,
  BeamFrameShell,
  BeamSvgLayer,
  normalizeDuration,
  useInteractiveRunning,
  useMeasuredFrameSize,
  type BeamFrameProps,
  type FrameSize,
} from './share-config';

function AnimeBeamLayer({
  isRunning,
  duration,
  radius,
  size,
}: {
  isRunning: boolean;
  duration: number;
  radius?: number;
  size: FrameSize;
}) {
  const aroundBeamRef = useRef<SVGGElement | null>(null);
  const animationRef = useRef<WAAPIAnimation | null>(null);
  const hasStartedRef = useRef(false);
  const gradientId = useId().replace(/:/g, '');
  const haloGradientId = useId().replace(/:/g, '');
  const auraGradientId = useId().replace(/:/g, '');
  const softGlowFilterId = useId().replace(/:/g, '');

  useEffect(() => {
    const node = aroundBeamRef.current;

    if (!node) {
      return undefined;
    }

    if (isRunning) {
      hasStartedRef.current = true;
    }

    node.style.opacity = isRunning || hasStartedRef.current ? 'var(--beam-frame-beam-opacity)' : '0';

    if (!isRunning) {
      animationRef.current?.pause();
      return undefined;
    }

    if (animationRef.current) {
      animationRef.current.speed = BASE_DURATION_SECONDS / duration;
      animationRef.current.play();
      return undefined;
    }

    animationRef.current = waapi.animate(node, {
      strokeDashoffset: [0, -1],
      loop: true,
      duration: BASE_DURATION_SECONDS * 1000,
      ease: 'linear',
    });
    animationRef.current.speed = BASE_DURATION_SECONDS / duration;

    return undefined;
  }, [duration, isRunning]);

  useEffect(() => {
    return () => {
      animationRef.current?.revert();
      animationRef.current = null;
    };
  }, []);

  return (
    <BeamSvgLayer
      beamRef={aroundBeamRef}
      auraGradientId={auraGradientId}
      gradientId={gradientId}
      haloGradientId={haloGradientId}
      softGlowFilterId={softGlowFilterId}
      radius={radius}
      size={size}
    />
  );
}

export function AnimeBeamFrame(props: BeamFrameProps) {
  const {
    children,
    active = false,
    interactive = true,
    tone = 'theme',
    duration = BASE_DURATION_SECONDS,
    radius,
    className,
  } = props;
  const prefersReducedMotion = useReducedMotion();
  const { isRunning, interactionProps } = useInteractiveRunning(active, interactive);
  const shouldRun = isRunning && !prefersReducedMotion;
  const normalizedDuration = normalizeDuration(duration);
  const { ref, size } = useMeasuredFrameSize<HTMLDivElement>();

  return (
    <BeamFrameShell
      active={active}
      interactive={interactive}
      tone={tone}
      duration={normalizedDuration}
      radius={radius}
      className={className}
      isRunning={shouldRun}
      interactionProps={interactionProps}
      rootRef={ref}
      renderBeam={() => (
        <AnimeBeamLayer
          isRunning={shouldRun}
          duration={normalizedDuration}
          radius={radius}
          size={size}
        />
      )}
    >
      {children}
    </BeamFrameShell>
  );
}
