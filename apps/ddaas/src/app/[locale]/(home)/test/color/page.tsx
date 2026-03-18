'use client';

import { useMemo, useState } from 'react';
import {
  __SUPPORTED_THEME_COLORS,
  THEME_BUTTON_GRADIENT_CLASS_MAP,
  THEME_BUTTON_GRADIENT_HOVER_CLASS_MAP,
  THEME_COLOR_NAME_TO_CLASS_MAP,
  THEME_HERO_EYES_ON_CLASS_MAP,
  THEME_RICH_TEXT_MARK_CLASS_MAP,
  type SupportedThemeColor,
} from '@base-ui/lib/theme-util';
import { cn } from '@lib/utils';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';

const themeNames = Object.keys(THEME_COLOR_NAME_TO_CLASS_MAP) as Array<keyof typeof THEME_COLOR_NAME_TO_CLASS_MAP>;

const THEME_TEXT_TITLE_CLASS_MAP: Record<SupportedThemeColor, string> = {
  'text-purple-500': 'text-purple-600 dark:text-purple-300',
  'text-orange-500': 'text-orange-600 dark:text-orange-300',
  'text-indigo-500': 'text-indigo-600 dark:text-indigo-300',
  'text-emerald-500': 'text-emerald-600 dark:text-emerald-300',
  'text-rose-500': 'text-rose-600 dark:text-rose-300',
};

function TonePreview({
  title,
  dark = false,
  themeClass,
  themeLabel,
}: {
  title: string;
  dark?: boolean;
  themeClass: SupportedThemeColor;
  themeLabel: string;
}) {
  const buttonBase = THEME_BUTTON_GRADIENT_CLASS_MAP[themeClass];
  const buttonHover = THEME_BUTTON_GRADIENT_HOVER_CLASS_MAP[themeClass];
  const heroEyesOn = THEME_HERO_EYES_ON_CLASS_MAP[themeClass];
  const markClass = THEME_RICH_TEXT_MARK_CLASS_MAP[themeClass];
  const titleClass = THEME_TEXT_TITLE_CLASS_MAP[themeClass];

  return (
    <div className={cn('rounded-2xl border p-5 shadow-sm', dark ? 'dark border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900')}>
      <div className="mb-4 grid grid-cols-3 items-center gap-2">
        <h2 className="text-left text-sm font-semibold tracking-wide">{title}</h2>
        <span className="text-center text-xs font-semibold opacity-80">{themeLabel}</span>
        <span className="text-right text-xs opacity-70">{themeClass}</span>
      </div>

      <div className="space-y-5">
        <section>
          <p className="mb-2 text-xs opacity-70">图标</p>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-slate-50/60 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <icons.Pi className={cn("w-10 h-10", themeClass)} />
            </span>
          </div>
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
  const themeLabel = useMemo(() => __SUPPORTED_THEME_COLORS[themeClass], [themeClass]);

  return (
    <main className="mt-12 min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 px-3 py-6 text-slate-900 sm:px-4 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Theme Color Switch Preview</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            快速查看主题切换后的效果
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            {themeNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setThemeName(name)}
                className={cn(
                  'w-full rounded-full border px-3 py-1.5 text-sm transition-all sm:w-auto',
                  themeName === name
                    ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500',
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </header>

        <section className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <TonePreview title="Light Mode" themeClass={themeClass} themeLabel={themeLabel} />
          <TonePreview title="Dark Mode" dark themeClass={themeClass} themeLabel={themeLabel} />
        </section>
      </div>
    </main>
  );
}
