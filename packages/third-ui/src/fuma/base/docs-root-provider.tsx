import type { ComponentProps, ReactNode } from 'react';
import { NextProvider } from 'fumadocs-core/framework/next';
import { I18nProvider, type I18nProviderProps } from 'fumadocs-ui/contexts/i18n';
import { SiteThemeRootProvider } from './site-theme-context';
import type { SiteThemeProviderProps } from './site-theme-provider';

type NextProviderComponents = {
  Link?: ComponentProps<typeof NextProvider>['Link'];
  Image?: ComponentProps<typeof NextProvider>['Image'];
};

export interface DocsRootProviderProps {
  i18n: Omit<I18nProviderProps, 'children'>;
  theme?: Omit<SiteThemeProviderProps, 'children'>;
  components?: NextProviderComponents;
  children: ReactNode;
}

export function DocsRootProvider({
  i18n,
  theme = {},
  components,
  children,
}: DocsRootProviderProps) {
  const themeMode = theme.mode ?? 'light-dark-system';

  return (
    <NextProvider
      Link={components?.Link}
      Image={components?.Image}
    >
      <I18nProvider {...i18n}>
        <SiteThemeRootProvider {...theme} mode={themeMode}>
          {children}
        </SiteThemeRootProvider>
      </I18nProvider>
    </NextProvider>
  );
}
