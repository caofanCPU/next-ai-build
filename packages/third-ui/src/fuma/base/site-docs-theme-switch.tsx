'use client';

import type { ComponentProps } from 'react';
import { HeaderThemeSwitch } from './header-theme-switch';
import { useSiteThemeMode } from './site-theme-context';

export function SiteDocsThemeSwitch(props: ComponentProps<'div'>) {
  const themeMode = useSiteThemeMode();

  if (themeMode !== 'light-dark-system') {
    return null;
  }

  return <HeaderThemeSwitch {...props} mode="light-dark-system" />;
}
