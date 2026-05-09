'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  BorderBeam,
  type BorderBeamColorVariant,
  type BorderBeamTheme,
} from 'border-beam';
import {
  ArrowUpIcon,
  AlarmClockIcon,
  CirclePauseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MonitorPlayIcon,
  SearchIcon,
} from '@base-ui/icons';
import {
  themeBgColor,
  themeBorderColor,
  themeIconColor,
  themeSvgIconColor,
} from '@base-ui/lib/theme-util';
import { cn } from '@lib/utils';
import {
  AnimeBeamFrame,
  MotionBeamFrame,
  type BeamFrameProps,
  type BeamFrameTone,
} from '@third-ui/main/beam-frame';
import { XToggleButton } from '@third-ui/main/buttons';

type BeamFrameComponent = (props: BeamFrameProps) => React.ReactElement;

const BORDER_BEAM_ANIMATE_TIME_SECONDS = Number(
  process.env.NEXT_PUBLIC_BORDER_BEAM_ANIMATE_TIME_SECONDS ?? 5
);
const PLAYBACK_DURATION_MS = Math.max(1, BORDER_BEAM_ANIMATE_TIME_SECONDS) * 1000;
const COUNTDOWN_HIDE_DELAY_MS = 650;

const pageShellClass =
  'min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-3 py-6 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 sm:px-4 sm:py-10';
const pageInnerClass = 'mx-auto mt-12 flex w-full max-w-7xl flex-col gap-6 md:gap-8';
const panelClass =
  'rounded-[28px] border border-border/60 bg-background p-3 pb-5 shadow-sm sm:p-4 sm:pb-6 md:p-6 md:pb-8';
const colorToggleClass = 'mx-auto max-w-full border-black/10 dark:border-white/10';
const beamFrameToggleClass = 'w-[min(100%,18.5rem)] border-black/10 dark:border-white/10 sm:w-auto sm:max-w-full';
const BORDER_BEAM_DURATION_OPTIONS = [
  { value: 1, label: 'Fast' },
  { value: 1.5, label: 'Mid' },
  { value: 2, label: 'Slow' },
] as const;

const BEAM_FRAME_DURATION_OPTIONS = [
  { value: 2.6, label: 'Fast' },
  { value: 3.6, label: 'Mid' },
  { value: 4.8, label: 'Slow' },
] as const;

const COLOR_OPTIONS: { value: BorderBeamColorVariant; label: string }[] = [
  { value: 'colorful', label: 'Colorful' },
  { value: 'mono', label: 'Mono' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunset', label: 'Sunset' },
];

const BEAM_FRAME_TONE_OPTIONS: { value: BeamFrameTone; label: string }[] = [
  { value: 'theme', label: 'Theme' },
  { value: 'rainbow', label: 'Rainbow' },
  { value: 'mono', label: 'Mono' },
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
];

function clampStrength(value: number) {
  return Math.min(100, Math.max(0, value));
}

export default function App() {
  const [beamTheme, setBeamTheme] = useState<BorderBeamTheme>('dark');
  const [active, setActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [colorVariant, setColorVariant] = useState<BorderBeamColorVariant>('colorful');
  const [beamFrameTone, setBeamFrameTone] = useState<BeamFrameTone>('theme');
  const [duration, setDuration] = useState(1.5);
  const [strength, setStrength] = useState(70);
  const [prompt, setPrompt] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const playbackTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const countdownHideTimerRef = useRef<number | null>(null);
  const strengthId = useId();
  const strengthProgress = clampStrength(strength);
  const strengthSliderBackground = `linear-gradient(90deg, ${themeSvgIconColor} 0%, ${themeSvgIconColor} ${strengthProgress}%, rgba(148, 163, 184, 0.24) ${strengthProgress}%, rgba(148, 163, 184, 0.24) 100%)`;
  const ToggleIcon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  const stopPlaybackTimer = useCallback(() => {
    if (countdownHideTimerRef.current !== null) {
      window.clearTimeout(countdownHideTimerRef.current);
      countdownHideTimerRef.current = null;
    }

    if (playbackTimerRef.current === null) {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      return;
    }

    window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const replayAnimation = useCallback(() => {
    stopPlaybackTimer();
    setActive(false);
    setRemainingSeconds(Math.ceil(BORDER_BEAM_ANIMATE_TIME_SECONDS));
    setShowCountdown(true);
    window.requestAnimationFrame(() => {
      setActive(true);
      countdownTimerRef.current = window.setInterval(() => {
        setRemainingSeconds((current) => Math.max(0, current - 1));
      }, 1000);
      playbackTimerRef.current = window.setTimeout(() => {
        setActive(false);
        setRemainingSeconds(0);
        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        countdownHideTimerRef.current = window.setTimeout(() => {
          setShowCountdown(false);
          countdownHideTimerRef.current = null;
        }, COUNTDOWN_HIDE_DELAY_MS);
        playbackTimerRef.current = null;
      }, PLAYBACK_DURATION_MS);
    });
  }, [stopPlaybackTimer]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((current) => {
      if (current) {
        stopPlaybackTimer();
        setActive(false);
        setRemainingSeconds(0);
        setShowCountdown(false);
      }

      return !current;
    });
  }, [stopPlaybackTimer]);

  useEffect(() => {
    const updateBeamTheme = () => {
      const documentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setBeamTheme(documentTheme);
    };
    const observer = new MutationObserver(updateBeamTheme);

    updateBeamTheme();
    observer.observe(document.documentElement, {
      attributeFilter: ['class'],
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current === null) {
        if (countdownHideTimerRef.current !== null) {
          window.clearTimeout(countdownHideTimerRef.current);
          countdownHideTimerRef.current = null;
        }

        if (countdownTimerRef.current !== null) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }

        return;
      }

      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
      if (countdownHideTimerRef.current !== null) {
        window.clearTimeout(countdownHideTimerRef.current);
        countdownHideTimerRef.current = null;
      }
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={pageShellClass}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg"
      >
        Skip to content
      </a>

      <main id="main-content" className={pageInnerClass}>
        <section className={cn(panelClass, 'relative overflow-hidden')}>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-cyan-100/70 via-white to-fuchsia-100/60 dark:from-cyan-950/30 dark:via-neutral-950 dark:to-fuchsia-950/20" />
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex w-full flex-col gap-3 text-left md:flex-row md:items-start md:justify-between"
            aria-expanded={isExpanded}
          >
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                Animate Test
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">BorderBeam Wrapper</h1>
            </div>
            <span className="inline-flex self-start items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent md:self-auto">
              <ToggleIcon className="h-4 w-4" />
              {isExpanded ? 'Fold' : 'Expand'}
            </span>
          </button>

          {isExpanded ? (
            <div className="mt-5 mb-4 h-px bg-border/70" />
          ) : null}

          {isExpanded ? (
            <div className="grid gap-6" aria-label="Border animation playground">
              <section className="grid gap-4" aria-label="BorderBeam AI input playground">
                <XToggleButton
                  options={COLOR_OPTIONS}
                  value={colorVariant}
                  onChange={(value) => setColorVariant(value as BorderBeamColorVariant)}
                  ariaLabel="Color variant"
                  size="compact"
                  className={colorToggleClass}
                  itemTextClassName="text-sm"
                  itemPaddingClassName="px-2.5 py-1.5 sm:px-4 sm:py-2"
                  minItemWidthClassName="min-w-[68px] sm:min-w-[88px]"
                  maxItemWidthClassName="max-w-[92px] sm:max-w-[160px]"
                  inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
                />

                <article className="mx-auto w-full max-w-184 rounded-[28px] border border-border/60 bg-background p-3 text-foreground shadow-sm sm:p-4 md:p-5">
                  <div className="mb-4">
                    <h3 className="text-base font-semibold">BorderBeam Wrapper</h3>
                  </div>

                  <div className="flex justify-center">
                    <BorderBeam
                      size="md"
                      colorVariant={colorVariant}
                      theme={beamTheme}
                      active={active}
                      className="w-full max-w-2xl"
                      duration={duration}
                      strength={strength / 100}
                    >
                      <div className="rounded-[28px] border border-border/60 bg-muted/35 p-3 shadow-sm sm:p-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground transition hover:bg-accent"
                            aria-label="Replay animation for five seconds"
                            onClick={replayAnimation}
                          >
                            <AlarmClockIcon className={cn('h-4 w-4', active && 'animate-spin')} />
                          </button>

                          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Animation duration">
                            {BORDER_BEAM_DURATION_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                className={cn(
                                  'rounded-full border px-2 py-1 text-xs font-semibold transition-colors sm:px-2.5',
                                  duration === option.value
                                    ? cn(themeBgColor, themeBorderColor, themeIconColor)
                                    : 'border-border/70 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground'
                                )}
                                role="radio"
                                aria-checked={duration === option.value}
                                onClick={() => setDuration(option.value)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>

                          {showCountdown ? (
                            <div
                              className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80"
                              aria-label={`Animation remaining ${remainingSeconds} seconds`}
                            >
                              <span className={cn('text-xs font-semibold tabular-nums', themeIconColor)}>
                                {remainingSeconds}s
                              </span>
                            </div>
                          ) : null}

                        </div>

                        <div className="mt-6">
                          <BorderBeam
                            size="line"
                            colorVariant={colorVariant}
                            theme={beamTheme}
                            active={active}
                            duration={duration}
                            borderRadius={16}
                            strength={strength / 100}
                          >
                            <div className="flex h-12 w-full items-center gap-2 rounded-2xl border border-border/60 bg-background/80 px-3 sm:gap-3 sm:px-4">
                              <SearchIcon className="h-4 w-4 shrink-0" />
                              <input
                                type="text"
                                className="h-full min-w-0 flex-1 bg-transparent text-base font-medium text-foreground outline-none placeholder:text-muted-foreground"
                                value={prompt}
                                onChange={(event) => setPrompt(event.target.value)}
                                placeholder="Build anything..."
                                aria-label="Prompt input"
                              />
                            </div>
                          </BorderBeam>
                        </div>

                        <div className="mt-5 flex items-center gap-2 sm:gap-3">
                          <div className="relative flex h-9 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-border/70 bg-background/80 px-3 sm:max-w-52 sm:flex-none sm:basis-52">
                            <span className="relative z-10 w-10 text-xs font-semibold text-foreground">{strength}%</span>
                            <input
                              id={strengthId}
                              type="range"
                              className="relative z-10 h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-full"
                              style={{
                                background: strengthSliderBackground,
                                accentColor: themeSvgIconColor,
                              }}
                              value={strength}
                              onChange={(event) => setStrength(parseInt(event.target.value, 10))}
                              min={0}
                              max={100}
                              step={1}
                              aria-label="Effect strength"
                            />
                          </div>

                          <button
                            type="button"
                            className="ml-auto shrink-0 rounded-full"
                            aria-label="Send prompt"
                          >
                            <BorderBeam
                              size="sm"
                              colorVariant={colorVariant}
                              theme={beamTheme}
                              active={active}
                              duration={duration}
                              strength={strength / 100}
                            >
                              <span
                                className={cn(
                                  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-transparent text-foreground transition hover:bg-accent',
                                  active && 'scale-105 shadow-lg shadow-primary/20'
                                )}
                              >
                                <ArrowUpIcon className={cn('h-5 w-5 transition-transform', active && '-translate-y-0.5')} />
                              </span>
                            </BorderBeam>
                          </button>
                        </div>
                      </div>
                    </BorderBeam>
                  </div>
                </article>
              </section>

              <div className="h-px" style={{ backgroundColor: themeSvgIconColor }} aria-hidden="true" />

              <BeamFrameComparePanel
                tone={beamFrameTone}
                setTone={setBeamFrameTone}
              />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function BeamFrameComparePanel({
  tone,
  setTone,
}: {
  tone: BeamFrameTone;
  setTone: (value: BeamFrameTone) => void;
}) {
  const [motionActive, setMotionActive] = useState(false);
  const [animeActive, setAnimeActive] = useState(false);
  const groupActive = motionActive && animeActive;
  const GroupPlaybackIcon = groupActive ? CirclePauseIcon : MonitorPlayIcon;

  const toggleGroupPlayback = () => {
    const nextActive = !groupActive;
    setMotionActive(nextActive);
    setAnimeActive(nextActive);
  };

  return (
    <section>
      <div className="mb-5 flex items-center justify-center gap-3">
        <XToggleButton
          options={BEAM_FRAME_TONE_OPTIONS}
          value={tone}
          onChange={(value) => setTone(value as BeamFrameTone)}
          ariaLabel="BeamFrame color tone"
          size="compact"
          fullWidth
          className={beamFrameToggleClass}
          itemTextClassName="text-xs sm:text-sm"
          itemPaddingClassName="px-1 py-1.5 sm:px-4 sm:py-2"
          minItemWidthClassName="min-w-[52px] sm:min-w-[104px]"
          maxItemWidthClassName="max-w-[68px] sm:max-w-[180px]"
          inactiveItemClassName="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
        />
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground transition hover:bg-accent"
          aria-label={groupActive ? 'Pause BeamFrame comparison animations' : 'Start BeamFrame comparison animations'}
          onClick={toggleGroupPlayback}
        >
          <GroupPlaybackIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BeamFrameDemoCard
          title="Motion React Wrapper"
          Frame={MotionBeamFrame}
          tone={tone}
          active={motionActive}
          setActive={setMotionActive}
        />
        <BeamFrameDemoCard
          title="Anime JS Wrapper"
          Frame={AnimeBeamFrame}
          tone={tone}
          active={animeActive}
          setActive={setAnimeActive}
          dark
        />
      </div>
    </section>
  );
}

function BeamFrameDemoCard({
  title,
  Frame,
  tone,
  active,
  setActive,
  dark = false,
}: {
  title: string;
  Frame: BeamFrameComponent;
  tone: BeamFrameTone;
  active: boolean;
  setActive: (value: boolean) => void;
  dark?: boolean;
}) {
  const [duration, setDuration] = useState(3.6);
  const [prompt, setPrompt] = useState('');

  return (
    <article
      className={cn(
        'rounded-[28px] border p-3 shadow-sm sm:p-4 md:p-5',
        dark
          ? 'border-slate-800 bg-slate-950 text-slate-100'
          : 'border-slate-200 bg-white text-slate-900',
      )}
    >
      <div className="mb-4 grid grid-cols-2 items-start gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
        <div className={cn('text-right text-xs font-medium', dark ? 'text-slate-400' : 'text-slate-500')}>
          {dark ? 'Dark' : 'Light'}
        </div>
      </div>

      <div className="flex justify-center">
        <Frame
          active={active}
          interactive={false}
          tone={tone}
          duration={duration}
          radius={28}
          className="w-full max-w-2xl"
        >
          <BeamFramePromptBox
            active={active}
            duration={duration}
            Frame={Frame}
            prompt={prompt}
            setDuration={setDuration}
            setActive={setActive}
            setPrompt={setPrompt}
            title={title}
            tone={tone}
            dark={dark}
          />
        </Frame>
      </div>
    </article>
  );
}

function BeamFramePromptBox({
  active,
  duration,
  Frame,
  prompt,
  setDuration,
  setActive,
  setPrompt,
  title,
  tone,
  dark,
}: {
  active: boolean;
  duration: number;
  Frame: BeamFrameComponent;
  prompt: string;
  setActive: (value: boolean) => void;
  setDuration: (value: number) => void;
  setPrompt: (value: string) => void;
  title: string;
  tone: BeamFrameTone;
  dark: boolean;
}) {
  const PlaybackIcon = active ? CirclePauseIcon : MonitorPlayIcon;
  const frameProps = {
    active,
    duration,
    interactive: false,
    tone,
  } satisfies Pick<BeamFrameProps, 'active' | 'duration' | 'interactive' | 'tone'>;

  return (
    <div
      className={cn(
        'rounded-[27px] border p-3 shadow-sm sm:p-4',
        dark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-slate-50/70',
      )}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition',
            dark
              ? 'border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800'
              : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100',
          )}
          aria-label={active ? `Pause ${title} animation` : `Start ${title} animation`}
          onClick={() => setActive(!active)}
        >
          <PlaybackIcon className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-wrap gap-1.5" role="radiogroup" aria-label={`${title} animation duration`}>
          {BEAM_FRAME_DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'rounded-full border px-2 py-1 text-xs font-semibold transition-colors sm:px-2.5',
                duration === option.value
                  ? cn(themeBgColor, themeBorderColor, themeIconColor)
                  : dark
                    ? 'border-slate-700 bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )}
              role="radio"
              aria-checked={duration === option.value}
              onClick={() => setDuration(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Frame {...frameProps} radius={16}>
          <div
            className={cn(
              'flex h-12 w-full items-center gap-2 rounded-2xl border px-3 sm:gap-3 sm:px-4',
              dark
                ? 'border-slate-700 bg-slate-950/90 text-slate-100'
                : 'border-slate-200 bg-white text-slate-900',
            )}
          >
            <SearchIcon className="h-4 w-4 shrink-0" />
            <input
              type="text"
              className={cn(
                'h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none',
                dark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400',
              )}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Build anything..."
              aria-label="Prompt input"
            />
          </div>
        </Frame>
      </div>

      <div className="mt-5 flex items-center gap-2 sm:gap-3">
        <Frame {...frameProps} radius={999} className="ml-auto shrink-0">
          <button
            type="button"
            className="shrink-0 rounded-full"
            aria-label="Send prompt"
          >
            <span
              className={cn(
                'inline-flex h-10 w-10 items-center justify-center rounded-full border transition',
                dark
                  ? 'border-slate-700 bg-transparent text-slate-100'
                  : 'border-slate-200 bg-transparent text-slate-900',
                active && 'scale-105 shadow-lg shadow-primary/20',
              )}
            >
              <ArrowUpIcon
                className={cn('h-5 w-5 transition-transform', active && '-translate-y-0.5')}
                style={{ color: active ? themeSvgIconColor : undefined }}
              />
            </span>
          </button>
        </Frame>
      </div>
    </div>
  );
}
