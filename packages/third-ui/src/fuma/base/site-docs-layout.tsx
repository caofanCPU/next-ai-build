import type { ReactNode } from 'react';
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import {
  normalizeNavItems,
  type SiteBaseLayoutConfig,
} from './site-layout-shared';

export interface SiteDocsLayoutConfig extends SiteBaseLayoutConfig {
  tree: DocsLayoutProps['tree'];
  sidebar?: DocsLayoutProps['sidebar'];
}

function toDocsLayoutOptions(config: SiteDocsLayoutConfig): DocsLayoutProps {
  return {
    ...(config.nav ? { nav: config.nav } : {}),
    ...(config.i18n ? { i18n: config.i18n } : {}),
    ...(config.githubUrl ? { githubUrl: config.githubUrl } : {}),
    ...(config.links ? { links: normalizeNavItems(config.links) } : {}),
    ...(config.searchToggle ? { searchToggle: config.searchToggle } : {}),
    ...(config.themeSwitch ? { themeSwitch: config.themeSwitch } : {}),
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
  return <DocsLayout {...options}>{children}</DocsLayout>;
}
