'use client';

import { useEffect, useMemo, useState } from 'react';
import NProgress from 'nprogress';
import {
  __SUPPORTED_THEME_COLORS,
  THEME_BUTTON_GRADIENT_CLASS_MAP,
  THEME_BUTTON_GRADIENT_HOVER_CLASS_MAP,
  THEME_COLOR_HEX_MAP,
  THEME_COLOR_NAME_TO_CLASS_MAP,
  THEME_HERO_EYES_ON_CLASS_MAP,
  THEME_RICH_TEXT_MARK_CLASS_MAP,
  type SupportedThemeColor,
} from '@base-ui/lib/theme-util';
import { cn } from '@lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { Loading } from '@third-ui/main/loading';
import { SnakeLoadingFrame, SnakeLoadingPreview } from '@third-ui/main';

const themeNames = Object.keys(THEME_COLOR_NAME_TO_CLASS_MAP) as Array<keyof typeof THEME_COLOR_NAME_TO_CLASS_MAP>;

const THEME_TEXT_TITLE_CLASS_MAP: Record<SupportedThemeColor, string> = {
  'text-purple-500': 'text-purple-600 dark:text-purple-300',
  'text-orange-500': 'text-orange-600 dark:text-orange-300',
  'text-indigo-500': 'text-indigo-600 dark:text-indigo-300',
  'text-emerald-500': 'text-emerald-600 dark:text-emerald-300',
  'text-rose-500': 'text-rose-600 dark:text-rose-300',
};

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

function TonePreview({
  title,
  dark = false,
  themeClass,
  themeHex,
  themeLabel,
  onRunNProgress,
}: {
  title: string;
  dark?: boolean;
  themeClass: SupportedThemeColor;
  themeHex: string;
  themeLabel: string;
  onRunNProgress: () => void;
}) {
  const buttonBase = THEME_BUTTON_GRADIENT_CLASS_MAP[themeClass];
  const buttonHover = THEME_BUTTON_GRADIENT_HOVER_CLASS_MAP[themeClass];
  const heroEyesOn = THEME_HERO_EYES_ON_CLASS_MAP[themeClass];
  const markClass = THEME_RICH_TEXT_MARK_CLASS_MAP[themeClass];
  const titleClass = THEME_TEXT_TITLE_CLASS_MAP[themeClass];
  const [isSnakeLoading, setIsSnakeLoading] = useState(true);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(true);
  const previewActionButtonClass = cn(
    'shrink-0 rounded-full border bg-white px-3 py-1.5 text-xs font-semibold transition-colors duration-200',
    themeClass,
    dark
      ? 'border-current/50 bg-slate-900 hover:border-current hover:bg-slate-800'
      : 'border-current/35 bg-white hover:border-current hover:bg-white',
  );
  const previewSurfaceClass = dark
    ? 'border-slate-700 bg-slate-900 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900';
  const previewSubsurfaceClass = dark
    ? 'bg-slate-800/60'
    : 'bg-slate-50/70';
  const circleFrameClass = dark
    ? 'border-slate-700 bg-slate-900'
    : 'border-slate-200 bg-white';

  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm', previewSurfaceClass)}>
      <div className="mb-4 grid grid-cols-3 items-center gap-2">
        <h2 className="text-left text-sm font-semibold tracking-wide">{title}</h2>
        <span className={cn('text-center text-xs font-semibold', themeClass)}>{themeLabel}</span>
        <span className={cn('text-right text-xs font-medium', themeClass)}>{themeClass}</span>
      </div>

      <div className="space-y-5">
        <section>
          <p className="mb-2 text-xs opacity-70">图标 / 进度条 /加载动画</p>
          <div
            className={cn(
              'flex flex-col gap-4 rounded-xl border border-current px-3 py-3',
              previewSubsurfaceClass,
              themeClass
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SnakeLoadingFrame
                  shape="circle"
                  loading={isSnakeLoading}
                  themeColor={themeHex}
                  className={cn(
                    'inline-flex h-16 w-16 items-center justify-center border',
                    circleFrameClass,
                    themeClass
                  )}
                  contentClassName="flex items-center justify-center"
                >
                  <span
                    className={cn(
                      "inline-flex h-full w-full items-center justify-center rounded-full",
                      themeClass
                    )}
                  >
                    <icons.Pi className={cn("h-9 w-9", themeClass)} />
                  </span>
                </SnakeLoadingFrame>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSnakeLoading((current) => !current)}
                  className={previewActionButtonClass}
                >
                  {isSnakeLoading ? 'Stop Ring' : 'Start Ring'}
                </button>
                <button
                  type="button"
                  onClick={onRunNProgress}
                  className={previewActionButtonClass}
                >
                  Run NProgress
                </button>
              </div>
            </div>
            <SnakeLoadingPreview
              shape="rounded-rect"
              themeColor={themeHex}
              strokeWidth={3}
              className="aspect-video w-full rounded-t-xl rounded-b-none p-0"
            >
              <div className="flex h-full w-full items-center justify-center rounded-t-xl rounded-b-none">
                <div className={cn('space-y-2 text-center', dark ? 'text-white' : 'text-slate-900')}>
                  <div className={cn('text-xs uppercase tracking-[0.16em]', dark ? 'text-slate-400' : 'text-slate-500')}>
                    Media Surface
                  </div>
                  <div className="text-sm font-semibold">Rounded rectangle border loader</div>
                </div>
              </div>
            </SnakeLoadingPreview>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs opacity-70">Loading 动画</p>
            <button
              type="button"
              onClick={() => setShowLoadingAnimation((current) => !current)}
              className={previewActionButtonClass}
            >
              {showLoadingAnimation ? 'Hide Loading' : 'Show Loading'}
            </button>
          </div>
          {showLoadingAnimation ? (
            <Loading
              themeColor={themeHex}
              compact
              label="Loading"
              className={cn(
                'overflow-hidden border border-current shadow-inner',
                dark
                  ? 'bg-slate-950'
                  : 'bg-linear-to-br from-slate-100 via-white to-slate-50',
                themeClass
              )}
              labelClassName={dark ? 'text-white' : 'text-slate-700'}
            />
          ) : (
            <div
              className={cn(
                'flex min-h-[250px] items-center justify-center rounded-[28px] border border-dashed text-sm font-medium',
                dark
                  ? 'border-slate-700 bg-slate-950 text-slate-400'
                  : 'border-slate-200 bg-slate-50 text-slate-500',
              )}
            >
              Loading preview paused
            </div>
          )}
        </section>

        <section>
          <p className="mb-2 text-xs opacity-70">按钮</p>
          <button
            type="button"
            className={cn(
              'rounded-full px-5 py-2 text-sm font-bold text-white shadow-lg transition-all duration-200',
              buttonBase,
              buttonHover,
              'hover:scale-[1.02] hover:shadow-xl',
            )}
          >
            Primary Action
          </button>
        </section>

        <section>
          <p className="mb-2 text-xs opacity-70">文本（Hero标题 / 普通标题 / 着色文本）</p>
          <h3 className="text-3xl font-bold leading-tight">
            Build Faster with{' '}
            <span className={cn('bg-clip-text text-transparent', heroEyesOn)}>Diaomao AI</span>
          </h3>
          <h4 className={cn('mt-3 text-lg font-semibold', titleClass)}>Theme-aware Section Title</h4>
          <p className="text-sm leading-7 opacity-90">
            The highlights with{' '}
            <mark className={cn('rounded px-1 text-neutral-800 dark:text-neutral-200', markClass)}>
              attention-friendly emphasis
            </mark>{' '}
            is eazy to be noticed.
          </p>
        </section>
      </div>
    </div>
  );
}

export default function ColorTestPage() {
  const [themeName, setThemeName] = useState<keyof typeof THEME_COLOR_NAME_TO_CLASS_MAP>('purple');

  const themeClass = useMemo(() => THEME_COLOR_NAME_TO_CLASS_MAP[themeName], [themeName]);
  const themeHex = useMemo(() => THEME_COLOR_HEX_MAP[themeClass], [themeClass]);
  const themeLabel = useMemo(() => __SUPPORTED_THEME_COLORS[themeClass], [themeClass]);

  useEffect(() => {
    const root = document.documentElement;
    const previousColor = root.style.getPropertyValue('--nprogress-bar-color');

    root.style.setProperty('--nprogress-bar-color', themeHex);

    return () => {
      if (previousColor) {
        root.style.setProperty('--nprogress-bar-color', previousColor);
      } else {
        root.style.removeProperty('--nprogress-bar-color');
      }
    };
  }, [themeHex]);

  const runNProgressDemo = () => {
    NProgress.start();
    window.setTimeout(() => {
      NProgress.done();
    }, 800);
  };

  return (
    <main className="mt-12 min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-3 py-6 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Theme Color Switch Preview</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            快速查看主题切换后的效果
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
                    : THEME_SELECTOR_CLASS_MAP[buttonThemeClass],
                )}
              >
                {name}
              </button>
              );
            })}
          </div>
        </header>

        <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <TonePreview title="Light Mode" themeClass={themeClass} themeHex={themeHex} themeLabel={themeLabel} onRunNProgress={runNProgressDemo} />
          <TonePreview title="Dark Mode" dark themeClass={themeClass} themeHex={themeHex} themeLabel={themeLabel} onRunNProgress={runNProgressDemo} />
        </section>
      </div>
    </main>
  );
}
