'use client';

import { useMemo, useState } from 'react';
import { BugIcon, CirclePauseIcon, EyeClosedIcon, EyeIcon, MonitorPlayIcon } from '@base-ui/icons';
import {
  __SUPPORTED_THEME_COLORS,
  THEME_COLOR_HEX_MAP,
  THEME_COLOR_NAME_TO_CLASS_MAP,
  type SupportedThemeColor,
} from '@base-ui/lib/theme-util';
import { SiteIcon } from '@/lib/site-config';
import { cn } from '@lib/utils';
import { AnimeNotFoundPage } from '@third-ui/main/anime';
import { NotFoundPage } from '@third-ui/main';

const themeNames = Object.keys(THEME_COLOR_NAME_TO_CLASS_MAP) as Array<keyof typeof THEME_COLOR_NAME_TO_CLASS_MAP>;

const THEME_SELECTOR_CLASS_MAP: Record<SupportedThemeColor, string> = {
  'text-purple-500': 'border-purple-200 bg-purple-50/90 text-purple-700 hover:border-purple-400 hover:bg-purple-100',
  'text-orange-500': 'border-orange-200 bg-orange-50/90 text-orange-700 hover:border-orange-400 hover:bg-orange-100',
  'text-indigo-500': 'border-indigo-200 bg-indigo-50/90 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100',
  'text-emerald-500': 'border-emerald-200 bg-emerald-50/90 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100',
  'text-rose-500': 'border-rose-200 bg-rose-50/90 text-rose-700 hover:border-rose-400 hover:bg-rose-100',
};

const THEME_SELECTOR_ACTIVE_CLASS_MAP: Record<SupportedThemeColor, string> = {
  'text-purple-500': 'border-purple-600 bg-purple-600 text-white shadow-[0_10px_30px_rgba(147,51,234,0.28)]',
  'text-orange-500': 'border-orange-600 bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.28)]',
  'text-indigo-500': 'border-indigo-600 bg-indigo-500 text-white shadow-[0_10px_30px_rgba(99,102,241,0.28)]',
  'text-emerald-500': 'border-emerald-600 bg-emerald-500 text-white shadow-[0_10px_30px_rgba(16,185,129,0.28)]',
  'text-rose-500': 'border-rose-600 bg-rose-500 text-white shadow-[0_10px_30px_rgba(244,63,94,0.28)]',
};

function PreviewFrame({
  title,
  dark,
  children,
}: {
  title: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border shadow-sm',
        dark
          ? 'dark border-neutral-800 bg-neutral-900 text-neutral-100'
          : 'border-neutral-200 bg-neutral-100 text-neutral-900'
      )}
    >
      <div className={cn('border-b px-4 py-3', dark ? 'border-neutral-800' : 'border-neutral-200')}>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="h-[560px] overflow-hidden">
        {children}
      </div>
    </section>
  );
}

function IconToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  themeClass,
  onClick,
  activeIcon,
  inactiveIcon,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  themeClass: SupportedThemeColor;
  onClick: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors duration-200 hover:bg-current/10',
        themeClass
      )}
      aria-label={active ? activeLabel : inactiveLabel}
      title={active ? activeLabel : inactiveLabel}
    >
      {active ? activeIcon : inactiveIcon}
    </button>
  );
}

export default function NotFoundTestPage() {
  const [themeName, setThemeName] = useState<keyof typeof THEME_COLOR_NAME_TO_CLASS_MAP>('purple');
  const [animeAmbientAnimated, setAnimeAmbientAnimated] = useState(false);
  const [animeDoorOpen, setAnimeDoorOpen] = useState(false);
  const [classicAnimated, setClassicAnimated] = useState(false);

  const themeClass = useMemo(() => THEME_COLOR_NAME_TO_CLASS_MAP[themeName], [themeName]);
  const themeHex = useMemo(() => THEME_COLOR_HEX_MAP[themeClass], [themeClass]);
  const themeLabel = useMemo(() => __SUPPORTED_THEME_COLORS[themeClass], [themeClass]);
  const themedSiteIcon = useMemo(() => <SiteIcon className={themeClass} />, [themeClass]);
  const themedBugIcon = useMemo(() => <BugIcon className={themeClass} />, [themeClass]);

  return (
    <main className="mt-12 min-h-screen bg-neutral-100 px-3 py-6 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-neutral-200 bg-neutral-50/90 p-4 shadow-sm backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/60 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">Theme Color Switch Preview</p>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            快速查看 404 页面在亮暗主题下的视觉效果。当前主题：{themeLabel} / {themeClass} / {themeHex}
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {themeNames.map((name) => {
              const buttonThemeClass = THEME_COLOR_NAME_TO_CLASS_MAP[name];
              const isActive = themeName === name;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setThemeName(name)}
                  className={cn(
                    'w-full rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-all duration-200 sm:w-auto',
                    isActive ? 'scale-[1.02]' : 'hover:-translate-y-0.5',
                    isActive
                      ? THEME_SELECTOR_ACTIVE_CLASS_MAP[buttonThemeClass]
                      : THEME_SELECTOR_CLASS_MAP[buttonThemeClass]
                  )}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </header>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Anime 404</h2>
            <div className="flex items-center gap-2">
              <IconToggleButton
                active={animeAmbientAnimated}
                activeLabel="Pause ambient animation"
                inactiveLabel="Run ambient animation"
                themeClass={themeClass}
                onClick={() => setAnimeAmbientAnimated((current) => !current)}
                activeIcon={<CirclePauseIcon className={cn('h-6 w-6', themeClass)} />}
                inactiveIcon={<MonitorPlayIcon className={cn('h-6 w-6', themeClass)} />}
              />
              <IconToggleButton
                active={animeDoorOpen}
                activeLabel="Close 404 door"
                inactiveLabel="Open 404 door"
                themeClass={themeClass}
                onClick={() => setAnimeDoorOpen((current) => !current)}
                activeIcon={<EyeClosedIcon className={cn('h-6 w-6', themeClass)} />}
                inactiveIcon={<EyeIcon className={cn('h-6 w-6', themeClass)} />}
              />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PreviewFrame title="Light Mode">
              <AnimeNotFoundPage siteIcon={themedSiteIcon} compact themeClass={themeClass} themeColor={themeHex} ambientAnimated={animeAmbientAnimated} doorOpen={animeDoorOpen} onDoorOpenChange={setAnimeDoorOpen} />
            </PreviewFrame>
            <PreviewFrame title="Dark Mode" dark>
              <AnimeNotFoundPage siteIcon={themedSiteIcon} compact themeClass={themeClass} themeColor={themeHex} ambientAnimated={animeAmbientAnimated} doorOpen={animeDoorOpen} onDoorOpenChange={setAnimeDoorOpen} />
            </PreviewFrame>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Classic 404</h2>
            <IconToggleButton
              active={classicAnimated}
              activeLabel="Pause classic animation"
              inactiveLabel="Run classic animation"
              themeClass={themeClass}
              onClick={() => setClassicAnimated((current) => !current)}
              activeIcon={<CirclePauseIcon className={cn('h-6 w-6', themeClass)} />}
              inactiveIcon={<MonitorPlayIcon className={cn('h-6 w-6', themeClass)} />}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PreviewFrame title="Light Mode">
              <NotFoundPage siteIcon={themedSiteIcon} errorIcon={themedBugIcon} compact themeClass={themeClass} animated={classicAnimated} />
            </PreviewFrame>
            <PreviewFrame title="Dark Mode" dark>
              <NotFoundPage siteIcon={themedSiteIcon} errorIcon={themedBugIcon} compact themeClass={themeClass} animated={classicAnimated} />
            </PreviewFrame>
          </div>
        </section>
      </div>
    </main>
  );
}
