import type { ComponentProps, ReactNode } from 'react';
import { NextProvider } from 'fumadocs-core/framework/next';
import { I18nProvider, type I18nProviderProps } from 'fumadocs-ui/contexts/i18n';
import { ThemeProvider, type ThemeProviderProps } from 'next-themes';

type NextProviderComponents = {
  Link?: ComponentProps<typeof NextProvider>['Link'];
  Image?: ComponentProps<typeof NextProvider>['Image'];
};

type ThemeOptions = ThemeProviderProps & {
  enabled?: boolean;
};

export interface DocsRootProviderProps {
  i18n: Omit<I18nProviderProps, 'children'>;
  theme?: ThemeOptions;
  components?: NextProviderComponents;
  children: ReactNode;
}

export function DocsRootProvider({
  i18n,
  theme = {},
  components,
  children,
}: DocsRootProviderProps) {
  let body = children;

  if (theme.enabled !== false) {
    body = (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...theme}
      >
        {body}
      </ThemeProvider>
    );
  }

  body = (
    <I18nProvider {...i18n}>
      {body}
    </I18nProvider>
  );

  return (
    <NextProvider
      Link={components?.Link}
      Image={components?.Image}
    >
      {body}
    </NextProvider>
  );
}
