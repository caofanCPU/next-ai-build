'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import { themeBgColor, themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';
import { SnakeLoadingFrame } from '../../main/snake-loading-frame';
import { GradientButton } from './gradient-button';

interface SunoEmbedProps {
  src: string;
  ratio?: string;
  title?: string;
}

const rawTimeoutSeconds = process.env.NEXT_PUBLIC_SUNO_EMBED_TIMEOUT_SECONDS ?? '30';
const parsedTimeoutSeconds = Number(rawTimeoutSeconds);
const SUNO_LOAD_TIMEOUT_MS =
  Number.isFinite(parsedTimeoutSeconds) && parsedTimeoutSeconds > 0
    ? parsedTimeoutSeconds * 1000
    : 5000;
const SUNO_SURFACE_COLOR = 'rgb(32, 40, 85)';

function toSunoEmbedUrl(src: string): string {
  try {
    const url = new URL(src);

    if (url.hostname !== 'suno.com' && url.hostname !== 'www.suno.com') {
      return src;
    }

    const pathParts = url.pathname.split('/').filter(Boolean);
    const [kind, id] = pathParts;

    if (!id) {
      return src;
    }

    if (kind === 'embed') {
      return `https://suno.com/embed/${id}`;
    }

    if (kind === 'song') {
      return `https://suno.com/embed/${id}`;
    }

    return src;
  } catch {
    return src;
  }
}

export function SunoEmbed({
  src,
  ratio = '30%',
  title = 'SUNO Music',
}: SunoEmbedProps) {
  const embedSrc = toSunoEmbedUrl(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTimeoutHint, setShowTimeoutHint] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.max(1, Math.ceil(SUNO_LOAD_TIMEOUT_MS / 1000)),
  );
  const timeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  useEffect(() => {
    const timeoutSeconds = Math.max(1, Math.ceil(SUNO_LOAD_TIMEOUT_MS / 1000));

    setIsLoaded(false);
    setShowTimeoutHint(false);
    setHasTimedOut(false);
    setRemainingSeconds(timeoutSeconds);

    timeoutRef.current = window.setTimeout(() => {
      setShowTimeoutHint(true);
      setHasTimedOut(true);
    }, SUNO_LOAD_TIMEOUT_MS);

    countdownRef.current = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          if (countdownRef.current !== null) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = null;
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownRef.current !== null) {
        window.clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [embedSrc]);

  const statusText = isLoaded
    ? ''
    : showTimeoutHint
      ? 'Unavailable network.'
      : `Loading... Remaining ${remainingSeconds}s`;

  const handleLoad = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current !== null) {
      window.clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setHasTimedOut(false);
    setShowTimeoutHint(false);
    setIsLoaded(true);
  };

  return (
    <div
      className={cn(
        'my-4 overflow-hidden rounded-[12px] border shadow-sm bg-white/70 dark:bg-white/5',
        themeBgColor,
      )}
    >
      <div
        className="relative border-b border-white/12"
        style={{ backgroundColor: SUNO_SURFACE_COLOR }}
      >
        <div className="relative flex items-baseline justify-between gap-3 px-4 py-1 sm:px-5">
          <p className="text-sm font-semibold tracking-[0.12em] text-white">
            {title}
          </p>
          {statusText ? (
            <p
              className={cn(
                'shrink-0 min-w-50 text-right text-[11px] font-medium tabular-nums tracking-[0.08em] sm:text-xs',
                showTimeoutHint ? 'text-red-500 dark:text-red-400' : 'text-white',
              )}
            >
              {statusText}
            </p>
          ) : null}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 0,
          paddingBottom: ratio,
          overflow: 'hidden',
          backgroundColor: SUNO_SURFACE_COLOR,
        }}
      >
        <SnakeLoadingFrame
          shape="rounded-rect"
          loading={!isLoaded && !hasTimedOut}
          themeColor={themeSvgIconColor}
          className="absolute inset-0"
          contentClassName="h-full w-full"
        >
          <>
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                <div className="relative z-10">
                  <GradientButton
                    title="Open in Suno"
                    href={src}
                    align="center"
                    className="no-underline"
                  />
                </div>
              </div>
            )}
            {!hasTimedOut && (
              <iframe
                src={embedSrc}
                title="Suno audio player"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  opacity: isLoaded ? 1 : 0,
                  transition: 'opacity 300ms ease',
                  pointerEvents: isLoaded ? 'auto' : 'none',
                }}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                onLoad={handleLoad}
                suppressHydrationWarning
              />
            )}
          </>
        </SnakeLoadingFrame>
      </div>
    </div>
  );
}
