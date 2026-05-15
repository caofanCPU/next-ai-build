'use client';

import { cva } from 'class-variance-authority';
import { AirplayIcon, MoonIcon, SunIcon } from '@windrun-huaiin/base-ui/icons';
import { useTheme } from 'next-themes';
import { type ComponentProps, useEffect, useState } from 'react';
import { cn } from '@windrun-huaiin/lib/utils';
import type { SiteThemeSwitchMode } from './site-layout-shared';

const itemVariants = cva('inline-flex size-6.5 items-center justify-center rounded-full p-1.5', {
  variants: {
    active: {
      true: 'bg-fd-accent',
      false: '',
    },
  },
});

const full = [['light', SunIcon] as const, ['dark', MoonIcon] as const, ['system', AirplayIcon] as const];

export interface HeaderThemeSwitchProps extends ComponentProps<'div'> {
  mode?: 'light-dark-system';
}

export function HeaderThemeSwitch({
  className,
  ...props
}: HeaderThemeSwitchProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const container = cn(
    'inline-flex items-center rounded-full border p-1 overflow-hidden *:rounded-full',
    className,
  );
  const iconClassName = 'size-3.5 text-neutral-600 dark:text-neutral-300';

  const value = mounted ? theme : null;

  return (
    <div className={container} data-theme-toggle="" {...props}>
      {full.map(([key, Icon]) => (
        <button
          key={key}
          type="button"
          aria-label={key}
          className={cn(itemVariants({ active: value === key }))}
          onClick={() => setTheme(key)}
        >
          <Icon className={iconClassName} fill="currentColor" />
        </button>
      ))}
    </div>
  );
}
