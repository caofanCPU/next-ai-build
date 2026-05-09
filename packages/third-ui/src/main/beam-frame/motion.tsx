'use client';

import { useEffect, useId, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';
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

type PlaybackControls = {
  speed: number;
  play: () => void;
  pause: () => void;
  stop: () => void;
};

function MotionAroundBeam({
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
  const gradientId = useId().replace(/:/g, '');
  const haloGradientId = useId().replace(/:/g, '');
  const auraGradientId = useId().replace(/:/g, '');
  const softGlowFilterId = useId().replace(/:/g, '');
  const beamGroupRef = useRef<SVGGElement | null>(null);
  const controlsRef = useRef<PlaybackControls | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const node = beamGroupRef.current;

    if (!node) {
      return undefined;
    }

    if (isRunning) {
      hasStartedRef.current = true;
    }

    node.style.opacity = isRunning || hasStartedRef.current ? 'var(--beam-frame-beam-opacity)' : '0';

    if (!isRunning) {
      controlsRef.current?.pause();
      return undefined;
    }

    if (controlsRef.current) {
      controlsRef.current.speed = BASE_DURATION_SECONDS / duration;
      controlsRef.current.play();
      return undefined;
    }

    controlsRef.current = animate(
      node,
      { strokeDashoffset: [0, -1] },
      {
        duration: BASE_DURATION_SECONDS,
        repeat: Infinity,
        ease: 'linear',
      },
    );
    controlsRef.current.speed = BASE_DURATION_SECONDS / duration;

    return undefined;
  }, [duration, isRunning]);

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, []);

  return (
    <BeamSvgLayer
      beamRef={beamGroupRef}
      auraGradientId={auraGradientId}
      gradientId={gradientId}
      haloGradientId={haloGradientId}
      softGlowFilterId={softGlowFilterId}
      radius={radius}
      size={size}
    />
  );
}

export function MotionBeamFrame(props: BeamFrameProps) {
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
        <MotionAroundBeam
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
