import type {
  CreateSiteNavGroupOptions,
  CreateSiteNavItemContext,
  SiteMenuGroupConfig,
  SiteMenuLeafConfig,
  SiteNavItemConfig,
  SiteNavLinkItemConfig,
} from './site-layout';

export interface LocalizedNavContextOptions {
  locale: string;
  localePrefixAsNeeded?: boolean;
  defaultLocale?: string;
  localizeHref: (locale: string, path: string, localePrefixAsNeeded: boolean, defaultLocale: string) => string;
}

export function createLocalizedNavContext(
  options: LocalizedNavContextOptions,
): CreateSiteNavItemContext {
  const {
    locale,
    localePrefixAsNeeded = true,
    defaultLocale = 'en',
    localizeHref,
  } = options;

  return {
    resolveUrl(path: string) {
      return localizeHref(locale, path, localePrefixAsNeeded, defaultLocale);
    },
  };
}

export function createLocalizedNavLink(
  item: SiteMenuLeafConfig,
  context: CreateSiteNavItemContext,
): SiteNavItemConfig {
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

export function createLocalizedNavGroup(
  item: SiteMenuGroupConfig,
  context: CreateSiteNavItemContext,
  options?: CreateSiteNavGroupOptions,
): SiteNavItemConfig {
  return {
    type: 'menu',
    text: item.text,
    ...(item.path ? { url: context.resolveUrl(item.path) } : {}),
    ...(item.prefetch !== undefined ? { prefetch: item.prefetch } : {}),
    items: [
      ...(item.landing
        ? [
            {
              ...createLocalizedNavLink(item.landing, context),
              menu: {
                ...(options?.featuredBanner ? { banner: options.featuredBanner } : {}),
                className: options?.featuredClassName ?? 'md:row-span-2',
              },
            } as SiteNavLinkItemConfig,
          ]
        : []),
      ...item.items.map((child) => createLocalizedNavLink(child, context)),
    ],
  };
}
