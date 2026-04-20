'use client';

import {
  themeBgColor,
  themeBorderColor,
  themeButtonGradientClass,
  themeButtonGradientHoverClass,
  themeIconColor,
  themeMainBgColor,
  themeRingColor,
} from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';

export const dialogSurfaceClass = cn(
  'w-[calc(100vw-2rem)] max-w-md rounded-2xl border bg-white p-5 text-neutral-950 shadow-2xl outline-none dark:bg-neutral-950 dark:text-neutral-50',
  'border-neutral-200 dark:border-neutral-800'
);

export const dialogThemedOverlayClass = cn(
  themeMainBgColor,
  'opacity-90 backdrop-blur-[2px] dark:opacity-85'
);

export const dialogContentClass = cn(
  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
  dialogSurfaceClass
);

export const dialogHeaderClass = 'flex items-start justify-between gap-4';

export const dialogTitleClass =
  'flex min-w-0 items-center gap-2 text-lg font-bold leading-tight text-neutral-950 dark:text-neutral-50';

export const dialogDescriptionClass =
  'mt-3 text-sm font-medium leading-relaxed text-neutral-600 dark:text-neutral-300';

export const dialogFooterClass = 'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end';

export const closeButtonClass =
  'inline-flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200';

export const secondaryButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:pointer-events-none disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';

export const primaryButtonClass = cn(
  'inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60',
  themeButtonGradientClass,
  themeButtonGradientHoverClass,
  themeRingColor
);

export const subtlePrimaryButtonClass = cn(
  'inline-flex min-h-10 items-center justify-center rounded-full border px-5 py-2 text-sm font-bold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60',
  themeBgColor,
  themeBorderColor,
  themeIconColor,
  themeRingColor
);

export const dangerButtonClass =
  'inline-flex min-h-10 items-center justify-center rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-60 dark:bg-red-600 dark:hover:bg-red-500';

export const highPriorityTitleClass = cn(
  'flex min-w-0 items-center gap-2 text-lg font-bold leading-tight',
  themeIconColor
);

export const highPrioritySurfaceClass = cn(
  dialogSurfaceClass,
  'backdrop-blur-md ring-4 animate-in zoom-in-95 duration-300',
  themeBorderColor,
  themeRingColor
);
