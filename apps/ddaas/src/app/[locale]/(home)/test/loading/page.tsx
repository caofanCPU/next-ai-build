'use client';

import { useCallback, useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CirclePauseIcon,
  MonitorPlayIcon,
} from '@base-ui/icons';
import { themeIconColor, themeSvgIconColor } from '@base-ui/lib/theme-util';
import { cn } from '@lib/utils';
import { AnimeSpiralLoading } from '@third-ui/main/anime';
import { Loading } from '@third-ui/main/loading';

const pageShellClass =
  'min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-3 py-6 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 sm:px-4 sm:py-10';
const pageInnerClass = 'mx-auto mt-12 flex w-full max-w-7xl flex-col gap-6 md:gap-8';
const panelClass =
  'rounded-[28px] border border-border/60 bg-background p-3 pb-5 shadow-sm sm:p-4 sm:pb-6 md:p-6 md:pb-8';
const demoCardClass =
  'min-w-0 rounded-[28px] border border-border/60 bg-background/80 p-3 shadow-sm sm:p-4';
const iconButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors duration-200 hover:bg-current/10';

type LoadingDemoCardProps = {
  title: string;
  description: string;
  paused: boolean;
  onTogglePaused: () => void;
  children: React.ReactNode;
};

function LoadingDemoCard({
  title,
  description,
  paused,
  onTogglePaused,
  children,
}: LoadingDemoCardProps) {
  const PlaybackIcon = paused ? MonitorPlayIcon : CirclePauseIcon;
  const actionLabel = paused ? `Resume ${title}` : `Pause ${title}`;

  return (
    <article className={demoCardClass}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <button
          type="button"
          className={cn(iconButtonClass, themeIconColor)}
          aria-label={actionLabel}
          title={actionLabel}
          onClick={onTogglePaused}
        >
          <PlaybackIcon className={cn('h-6 w-6', themeIconColor)} />
        </button>
      </div>
      {children}
    </article>
  );
}

export default function LoadingTestPage() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isClassicPaused, setIsClassicPaused] = useState(false);
  const [isSpiralPaused, setIsSpiralPaused] = useState(false);
  const ToggleIcon = isExpanded ? ChevronUpIcon : ChevronDownIcon;

  const toggleExpanded = useCallback(() => {
    setIsExpanded((current) => {
      if (current) {
        setIsClassicPaused(true);
        setIsSpiralPaused(true);
      }

      return !current;
    });
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
                Loading Test
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Loading Animation
              </h1>
            </div>
            <span className="inline-flex min-w-24 self-start items-center justify-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent md:self-auto">
              <ToggleIcon className="h-4 w-4" />
              {isExpanded ? 'Fold' : 'Expand'}
            </span>
          </button>

          {isExpanded ? <div className="mt-5 mb-4 h-px bg-border/70" /> : null}

          {isExpanded ? (
            <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading animation comparison">
              <LoadingDemoCard
                title="Classic Dot Loading"
                description="Anime JS engine drives the original dot ripple rendering."
                paused={isClassicPaused}
                onTogglePaused={() => setIsClassicPaused((current) => !current)}
              >
                <Loading
                  compact
                  paused={isClassicPaused}
                  themeColor={themeSvgIconColor}
                  label={isClassicPaused ? 'Paused' : 'Loading'}
                  className="min-h-[360px] overflow-hidden bg-transparent dark:bg-transparent"
                  labelClassName="text-slate-700 dark:text-white"
                />
              </LoadingDemoCard>

              <LoadingDemoCard
                title="Anime Spiral Loading"
                description="Anime JS timeline renders the official spiral loading effect."
                paused={isSpiralPaused}
                onTogglePaused={() => setIsSpiralPaused((current) => !current)}
              >
                <AnimeSpiralLoading
                  paused={isSpiralPaused}
                  className="h-[360px] min-h-[360px] rounded-[28px]"
                  dotCount={1024}
                  distanceRem={11}
                  fontSize={14}
                />
              </LoadingDemoCard>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
