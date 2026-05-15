import type { ComponentProps, ReactNode } from 'react';
import { NextProvider } from 'fumadocs-core/framework/next';
import { I18nProvider, type I18nProviderProps } from 'fumadocs-ui/contexts/i18n';

type NextProviderComponents = {
  Link?: ComponentProps<typeof NextProvider>['Link'];
  Image?: ComponentProps<typeof NextProvider>['Image'];
};

export interface DocsRootProviderProps {
  i18n: Omit<I18nProviderProps, 'children'>;
  components?: NextProviderComponents;
  children: ReactNode;
}

export function DocsRootProvider({
  i18n,
  components,
  children,
}: DocsRootProviderProps) {
  return (
    <NextProvider
      Link={components?.Link}
      Image={components?.Image}
    >
      <I18nProvider {...i18n}>
        {children}
      </I18nProvider>
    </NextProvider>
  );
}
