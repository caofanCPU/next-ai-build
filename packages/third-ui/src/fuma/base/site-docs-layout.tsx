import type { ReactNode } from 'react';
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import {
  normalizeNavItems,
  type SiteBaseLayoutConfig,
} from './site-layout-shared';
import { SiteThemeProvider } from './site-theme-provider';

export interface SiteDocsLayoutConfig extends SiteBaseLayoutConfig {
  tree: DocsLayoutProps['tree'];
  sidebar?: DocsLayoutProps['sidebar'];
  themeProvider?: boolean;
}

function toDocsLayoutOptions(config: SiteDocsLayoutConfig): DocsLayoutProps {
  const themeMode = config.themeSwitch?.mode ?? 'light-dark-system';
  const shouldShowThemeSwitch =
    config.themeProvider !== false &&
    (themeMode === 'light-dark' || themeMode === 'light-dark-system');
  return {
    ...(config.nav ? { nav: config.nav } : {}),
    ...(config.i18n ? { i18n: config.i18n } : {}),
    ...(config.githubUrl ? { githubUrl: config.githubUrl } : {}),
    ...(config.links ? { links: normalizeNavItems(config.links) } : {}),
    ...(config.searchToggle ? { searchToggle: config.searchToggle } : {}),
    ...(shouldShowThemeSwitch
      ? {
          themeSwitch: {
            mode: themeMode,
          },
        }
      : {
          themeSwitch: {
            enabled: false,
          },
        }),
    ...(config.sidebar ? { sidebar: config.sidebar } : {}),
    tree: config.tree,
  };
}

export function SiteDocsLayout({
  config,
  children,
}: {
  config: SiteDocsLayoutConfig;
  children: ReactNode;
}) {
  const options = toDocsLayoutOptions(config);
  const themeMode = config.themeSwitch?.mode ?? 'light-dark-system';
  const body = <DocsLayout {...options}>{children}</DocsLayout>;

  if (config.themeProvider === false) return body;

  return <SiteThemeProvider mode={themeMode}>{body}</SiteThemeProvider>;
}
