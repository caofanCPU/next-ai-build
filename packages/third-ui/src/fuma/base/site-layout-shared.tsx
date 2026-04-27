import type { HTMLAttributes, ReactNode } from 'react';
import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import type { LinkItemType } from 'fumadocs-ui/layouts/shared';

export type ExtendedLinkItem = LinkItemType & {
  mobilePinned?: boolean;
  prefetch?: boolean;
};

type SiteMenuConfig = HTMLAttributes<HTMLElement> & {
  banner?: ReactNode;
};

interface SiteNavSharedFields {
  secondary?: boolean;
  mobilePinned?: boolean;
}

export interface SiteNavLinkItemConfig extends SiteNavSharedFields {
  type?: 'main' | 'icon' | 'button';
  text: ReactNode;
  url: string;
  external?: boolean;
  prefetch?: boolean;
  icon?: ReactNode;
  description?: ReactNode;
  menu?: SiteMenuConfig;
  on?: 'nav' | 'menu' | 'all';
  label?: string;
}

export interface SiteNavMenuItemConfig extends SiteNavSharedFields {
  type: 'menu';
  text: ReactNode;
  url?: string;
  external?: boolean;
  prefetch?: boolean;
  icon?: ReactNode;
  description?: ReactNode;
  items: SiteNavItemConfig[];
  menu?: SiteMenuConfig;
  on?: 'nav' | 'menu' | 'all';
}

export interface SiteNavCustomItemConfig extends SiteNavSharedFields {
  type: 'custom';
  children: ReactNode;
}

export type SiteNavItemConfig =
  | SiteNavLinkItemConfig
  | SiteNavMenuItemConfig
  | SiteNavCustomItemConfig;

export interface SiteBaseLayoutConfig {
  nav?: HomeLayoutProps['nav'];
  i18n?: HomeLayoutProps['i18n'];
  githubUrl?: string;
  links?: SiteNavItemConfig[];
  searchToggle?: HomeLayoutProps['searchToggle'];
  themeSwitch?: HomeLayoutProps['themeSwitch'];
}

export interface SiteMenuLeafConfig {
  text: ReactNode;
  path: string;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  external?: boolean;
  prefetch?: boolean;
}

export interface SiteMenuGroupConfig {
  text: ReactNode;
  path?: string;
  prefetch?: boolean;
  landing?: SiteMenuLeafConfig;
  items: SiteMenuLeafConfig[];
}

export interface CreateSiteNavItemContext {
  resolveUrl: (path: string) => string;
}

export interface CreateSiteNavGroupOptions {
  featuredClassName?: string;
  featuredBanner?: ReactNode;
}

export interface CreateSiteBaseLayoutOptions {
  homeUrl: string;
  title: ReactNode;
  i18n?: HomeLayoutProps['i18n'];
  githubUrl?: string;
  transparentMode?: HomeLayoutProps['nav'] extends infer T
    ? T extends { transparentMode?: infer U }
      ? U
      : never
    : never;
}

export function normalizeNavItems(items?: SiteNavItemConfig[]): ExtendedLinkItem[] | undefined {
  if (!items) return undefined;

  return items.map((item) => {
    if (item.type === 'menu') {
      return {
        ...item,
        items: normalizeNavItems(item.items) ?? [],
      } as ExtendedLinkItem;
    }

    return item as ExtendedLinkItem;
  });
}

export function createSiteNavLink(
  item: SiteMenuLeafConfig,
  context: CreateSiteNavItemContext,
): SiteNavLinkItemConfig {
  return {
    type: 'main',
    text: item.text,
    ...(item.description ? { description: item.description } : {}),
    url: context.resolveUrl(item.path),
    ...(item.external ? { external: item.external } : {}),
    ...(item.prefetch !== undefined ? { prefetch: item.prefetch } : {}),
    ...(item.icon || item.className
      ? {
          menu: {
            ...(item.icon ? { banner: item.icon } : {}),
            ...(item.className ? { className: item.className } : {}),
          },
        }
      : {}),
  };
}

export function createSiteNavGroup(
  item: SiteMenuGroupConfig,
  context: CreateSiteNavItemContext,
  options?: CreateSiteNavGroupOptions,
): SiteNavMenuItemConfig {
  return {
    type: 'menu',
    text: item.text,
    ...(item.path ? { url: context.resolveUrl(item.path) } : {}),
    ...(item.prefetch !== undefined ? { prefetch: item.prefetch } : {}),
    items: [
      ...(item.landing
        ? [
            {
              ...createSiteNavLink(item.landing, context),
              menu: {
                ...(options?.featuredBanner ? { banner: options.featuredBanner } : {}),
                className: options?.featuredClassName ?? 'md:row-span-2',
              },
            } satisfies SiteNavLinkItemConfig,
          ]
        : []),
      ...item.items.map((child) => createSiteNavLink(child, context)),
    ],
  };
}

export function createSiteBaseLayoutConfig(
  options: CreateSiteBaseLayoutOptions,
): SiteBaseLayoutConfig {
  return {
    nav: {
      url: options.homeUrl,
      title: options.title,
      transparentMode: options.transparentMode ?? 'none',
    },
    ...(options.i18n ? { i18n: options.i18n } : {}),
    ...(options.githubUrl ? { githubUrl: options.githubUrl } : {}),
  };
}

export function toHomeLayoutOptions(config: SiteBaseLayoutConfig): HomeLayoutProps {
  return {
    ...(config.nav ? { nav: config.nav } : {}),
    ...(config.i18n ? { i18n: config.i18n } : {}),
    ...(config.githubUrl ? { githubUrl: config.githubUrl } : {}),
    ...(config.links ? { links: normalizeNavItems(config.links) } : {}),
    ...(config.searchToggle ? { searchToggle: config.searchToggle } : {}),
    ...(config.themeSwitch ? { themeSwitch: config.themeSwitch } : {}),
  };
}
