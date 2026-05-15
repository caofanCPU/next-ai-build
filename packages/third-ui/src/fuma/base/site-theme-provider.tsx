'use client';

import type { ReactNode } from 'react';
import { ThemeProvider, type ThemeProviderProps } from 'next-themes';
import type { SiteThemeSwitchMode } from './site-layout-shared';

export interface SiteThemeProviderProps extends Omit<ThemeProviderProps, 'children'> {
  mode?: SiteThemeSwitchMode;
  children: ReactNode;
}

export function SiteThemeProvider({
  mode = 'light-dark-system',
  children,
  ...props
}: SiteThemeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      {...resolveThemeProviderProps(mode)}
      {...props}
    >
      {children}
    </ThemeProvider>
  );
}

function resolveThemeProviderProps(mode: SiteThemeSwitchMode): ThemeProviderProps {
  if (mode === 'light-only') {
    return {
      forcedTheme: 'light',
      enableSystem: false,
      defaultTheme: 'light',
    };
  }

  if (mode === 'dark-only') {
    return {
      forcedTheme: 'dark',
      enableSystem: false,
      defaultTheme: 'dark',
    };
  }

  if (mode === 'light-dark') {
    return {
      enableSystem: false,
      defaultTheme: 'light',
      forcedTheme: undefined,
    };
  }

  return {
    enableSystem: true,
    defaultTheme: 'system',
    forcedTheme: undefined,
  };
}
