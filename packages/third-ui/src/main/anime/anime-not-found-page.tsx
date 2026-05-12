'use client';

import { themeBgColor, themeButtonGradientClass, themeIconColor, themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import { animate, createTimeline, stagger, type JSAnimation, type Timeline } from 'animejs';
import { useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

export interface AnimeNotFoundPageProps {
  siteIcon: ReactNode;
  homeUrl?: string;
  className?: string;
}

const dust = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  left: `${12 + index * 8}%`,
  top: `${18 + (index % 5) * 13}%`,
  size: 3 + (index % 3),
}));

export function AnimeNotFoundPage({
  siteIcon,
  homeUrl = process.env.NEXT_PUBLIC_BASE_URL || '/',
  className,
}: AnimeNotFoundPageProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const shimmerRef = useRef<JSAnimation | null>(null);
  const doorAnimationRef = useRef<JSAnimation | null>(null);
  const lightAnimationRef = useRef<JSAnimation | null>(null);
  const handleAnimationRef = useRef<JSAnimation | null>(null);
  const messageAnimationRef = useRef<JSAnimation | null>(null);
  const isDoorOpenRef = useRef(true);
  const prefersReducedMotion = useReducedMotion();
  const doorStyle = useMemo(
    () => ({
      '--not-found-theme': themeSvgIconColor,
    }) as React.CSSProperties,
    []
  );

  useEffect(() => {
    const root = rootRef.current;

    if (!root || prefersReducedMotion) {
      return undefined;
    }

    const door = root.querySelector<HTMLElement>('[data-not-found-door]');
    const light = root.querySelector<HTMLElement>('[data-not-found-light]');
    const message = root.querySelector<HTMLElement>('[data-not-found-message]');
    const plate = root.querySelector<HTMLElement>('[data-not-found-plate]');
    const handle = root.querySelector<HTMLElement>('[data-not-found-handle]');
    const dustNodes = Array.from(root.querySelectorAll<HTMLElement>('[data-not-found-dust]'));

    if (!door || !light || !plate || !handle) {
      return undefined;
    }

    door.style.transform = 'rotateY(-62deg) translateX(-10px)';
    light.style.opacity = '0.74';
    light.style.transform = 'scaleX(1.2)';
    if (message) {
      message.style.opacity = '1';
      message.style.transform = 'translateY(0)';
    }

    timelineRef.current?.revert();
    timelineRef.current = createTimeline({ loop: true })
      .add(plate, {
        translateY: [0, -3, 0],
        scale: [1, 1.025, 1],
        duration: 1400,
        ease: 'inOutSine',
      })
      .add(plate, {
        translateY: [0, -3, 0],
        scale: [1, 1.025, 1],
        duration: 1400,
        ease: 'inOutSine',
      }, '+=900')
      .add(dustNodes, {
        opacity: [0, 0.72, 0],
        translateY: [14, -18],
        translateX: (_target: unknown, index: number) => (index % 2 === 0 ? 10 : -10),
        scale: [0.4, 1, 0.6],
        duration: 1800,
        delay: stagger(80),
        ease: 'outSine',
      }, '<+=200');

    shimmerRef.current?.revert();
    shimmerRef.current = animate(root.querySelectorAll<HTMLElement>('[data-not-found-shimmer]'), {
      translateX: ['-120%', '120%'],
      opacity: [0, 0.8, 0],
      duration: 2400,
      delay: stagger(160),
      ease: 'inOutSine',
      loop: true,
    });

    return () => {
      timelineRef.current?.revert();
      timelineRef.current = null;
      shimmerRef.current?.revert();
      shimmerRef.current = null;
      doorAnimationRef.current?.revert();
      doorAnimationRef.current = null;
      lightAnimationRef.current?.revert();
      lightAnimationRef.current = null;
      handleAnimationRef.current?.revert();
      handleAnimationRef.current = null;
      messageAnimationRef.current?.revert();
      messageAnimationRef.current = null;
    };
  }, [prefersReducedMotion]);

  const toggleDoor = () => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const door = root.querySelector<HTMLElement>('[data-not-found-door]');
    const light = root.querySelector<HTMLElement>('[data-not-found-light]');
    const handle = root.querySelector<HTMLElement>('[data-not-found-handle]');
    const message = root.querySelector<HTMLElement>('[data-not-found-message]');

    if (!door || !light || !handle) {
      return;
    }

    const nextOpen = !isDoorOpenRef.current;
    isDoorOpenRef.current = nextOpen;

    doorAnimationRef.current?.pause();
    lightAnimationRef.current?.pause();
    handleAnimationRef.current?.pause();
    messageAnimationRef.current?.pause();
    doorAnimationRef.current = null;
    lightAnimationRef.current = null;
    handleAnimationRef.current = null;
    messageAnimationRef.current = null;

    if (prefersReducedMotion) {
      door.style.transform = nextOpen ? 'rotateY(-72deg) translateX(-12px)' : 'rotateY(-2deg) translateX(0)';
      light.style.opacity = nextOpen ? '0.8' : '0.2';
      light.style.transform = nextOpen ? 'scaleX(1.28)' : 'scaleX(0.78)';
      if (message) {
        message.style.opacity = nextOpen ? '1' : '0';
        message.style.transform = nextOpen ? 'translateY(0)' : 'translateY(8px)';
      }
      return;
    }

    doorAnimationRef.current = animate(door, {
      rotateY: nextOpen ? -72 : -2,
      translateX: nextOpen ? -12 : 0,
      duration: 1050,
      ease: 'inOutCubic',
    });
    lightAnimationRef.current = animate(light, {
      opacity: nextOpen ? 0.8 : 0.2,
      scaleX: nextOpen ? 1.28 : 0.78,
      duration: 1050,
      ease: 'inOutSine',
    });
    handleAnimationRef.current = animate(handle, {
      scale: [1, 1.05, 1],
      duration: 520,
      ease: 'inOutSine',
    });
    if (message) {
      messageAnimationRef.current = animate(message, {
        opacity: nextOpen ? [0, 1] : [1, 0],
        translateY: nextOpen ? [10, 0] : [0, 4, 10],
        scale: nextOpen ? [0.96, 1] : [1, 0.98],
        duration: nextOpen ? 620 : 520,
        delay: nextOpen ? 320 : 280,
        ease: nextOpen ? 'outCubic' : 'inOutSine',
      });
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn('relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-4 py-8', className)}
      style={doorStyle}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.75),transparent_34%),linear-gradient(180deg,rgba(250,250,250,0.96),rgba(244,244,245,0.72))] dark:bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(24,24,27,0.96),rgba(9,9,11,0.92))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.05))] dark:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.34))]" />

      <div className="flex w-full max-w-3xl flex-col items-center gap-5">
        <section className="text-center">
          <h3 className={cn('whitespace-nowrap text-[clamp(2.15rem,8vw,3.4rem)] font-black leading-none tracking-normal bg-linear-to-r bg-clip-text text-transparent', themeButtonGradientClass)}>
            Page Not Found
          </h3>
        </section>

        <section className="flex w-full justify-center">
          <div className="relative aspect-[0.78] w-full max-w-[270px] sm:max-w-[315px] md:max-w-[330px] perspective-distant">
            <div
              data-not-found-light=""
              className="absolute left-[14%] top-[7%] h-[86%] w-[72%] rounded-[28px] bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.96),color-mix(in_srgb,var(--not-found-theme)_42%,transparent)_42%,transparent_72%)] opacity-25 blur-xl"
            />
            <div className="absolute inset-[4%] rounded-[32px] border border-black/10 bg-neutral-950/5 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-white/5" />
            <div className="absolute inset-[8%] rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(228,228,231,0.86))] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:bg-[linear-gradient(180deg,rgba(39,39,42,0.92),rgba(24,24,27,0.96))]" />
            <p
              data-not-found-message=""
              className="pointer-events-none absolute right-[16%] top-[29%] z-2 max-w-[46%] text-right text-sm font-medium leading-6 text-muted-foreground opacity-100"
            >
              <span className="block">The page</span>
              <span className="block">you&#39;re looking for</span>
              <span className="block">doesn&#39;t exist</span>
            </p>
            <button
              type="button"
              className="absolute inset-[8%] z-1 rounded-[26px] outline-none focus-visible:ring-2 focus-visible:ring-(--not-found-theme)"
              aria-label="Toggle the 404 door"
              onClick={toggleDoor}
            />

            <div
              data-not-found-door=""
              className="absolute inset-[8%] z-10 origin-left rounded-[26px] border border-black/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(212,212,216,0.9))] shadow-2xl shadow-black/20 will-change-transform dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(63,63,70,0.96),rgba(24,24,27,0.98))]"
            >
              <div className="absolute inset-4 overflow-hidden rounded-[20px]">
                <div data-not-found-shimmer="" className="absolute inset-y-0 w-1/3 -skew-x-12 bg-white/35 blur-md dark:bg-white/12" />
                <a
                  href={homeUrl}
                  className="absolute inset-x-5 bottom-5 flex h-[39%] flex-col items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/25 text-sm text-muted-foreground transition-opacity hover:opacity-80 dark:border-white/10 dark:bg-white/5"
                >
                  <span className="inline-flex items-center gap-2">
                    {siteIcon}
                    <span>Woops!</span>
                  </span>
                  <span className={cn('text-xs font-semibold underline underline-offset-4', themeIconColor, 'decoration-current')}>
                    Back to Homepage
                  </span>
                </a>
              </div>

              <div
                data-not-found-plate=""
                className="absolute left-1/2 top-[18%] flex h-[88px] w-[156px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white/86 shadow-lg shadow-black/10 dark:border-white/10 dark:bg-black/30"
              >
                <div data-not-found-shimmer="" className="absolute inset-y-0 w-1/2 -skew-x-12 bg-white/60 blur-md dark:bg-white/15" />
                <span className={cn('relative text-5xl font-black tabular-nums bg-linear-to-r bg-clip-text text-transparent', themeButtonGradientClass)}>
                  404
                </span>
              </div>

              <button
                type="button"
                data-not-found-handle=""
                className="group absolute right-[1%] top-[39%] z-10 flex size-12 items-center justify-center rounded-full outline-none ring-offset-2 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-(--not-found-theme)"
                aria-label="Toggle the 404 door"
                onClick={toggleDoor}
              >
                <span className="relative grid h-8 w-6 place-items-center rounded-full border border-black/10 bg-white/50 shadow-inner shadow-black/10 backdrop-blur-sm transform-[rotateY(18deg)] dark:border-white/15 dark:bg-black/25">
                  <span className="absolute size-10 rounded-full bg-(--not-found-theme) opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-25" />
                  <span className="relative grid size-4 place-items-center rounded-full border border-black/10 bg-(--not-found-theme) shadow-lg shadow-black/25 dark:border-white/15">
                    <span className="absolute right-1 top-1 size-1 rounded-full bg-white/75" />
                  </span>
                </span>
              </button>
            </div>

            {dust.map(dot => (
              <span
                key={dot.id}
                data-not-found-dust=""
                className="absolute rounded-full bg-(--not-found-theme) opacity-0"
                style={{
                  left: dot.left,
                  top: dot.top,
                  width: dot.size,
                  height: dot.size,
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
