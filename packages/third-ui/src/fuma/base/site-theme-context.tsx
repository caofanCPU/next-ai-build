'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { SiteThemeSwitchMode } from './site-layout-shared';
import { SiteThemeProvider, type SiteThemeProviderProps } from './site-theme-provider';

const SiteThemeModeContext = createContext<SiteThemeSwitchMode>('light-dark-system');

export function useSiteThemeMode(): SiteThemeSwitchMode {
  return useContext(SiteThemeModeContext);
}

export interface SiteThemeRootProviderProps
  extends Omit<SiteThemeProviderProps, 'children'> {
  children: ReactNode;
}

export function SiteThemeRootProvider({
  mode = 'light-dark-system',
  children,
  ...props
}: SiteThemeRootProviderProps) {
  return (
    <SiteThemeModeContext.Provider value={mode}>
      <SiteThemeProvider {...props} mode={mode}>
        {children}
      </SiteThemeProvider>
    </SiteThemeModeContext.Provider>
  );
}
