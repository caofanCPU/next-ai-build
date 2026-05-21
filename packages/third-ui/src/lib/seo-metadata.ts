import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';

export interface CreateLocalizedSiteMetadataOptions {
  locale: string;
  baseUrl: string;
  locales: readonly string[];
  defaultLocale: string;
  localePrefixAsNeeded: boolean;
}

export interface LocalizedPageUrlOptions extends CreateLocalizedSiteMetadataOptions {
  pathname: string;
}

export type LocalizedSiteMetadata = Pick<
  Metadata,
  'title' | 'description' | 'keywords' | 'icons' | 'openGraph' | 'twitter'
>;

export type LocalizedPageMetadataOverrides = Pick<
  Metadata,
  | 'title'
  | 'description'
  | 'keywords'
  | 'icons'
  | 'openGraph'
  | 'twitter'
  | 'robots'
  | 'authors'
  | 'creator'
  | 'publisher'
  | 'category'
>;

export interface CreateLocalizedPageMetadataOptions {
  url: LocalizedPageUrlOptions;
  site?: LocalizedSiteMetadata;
  page?: LocalizedPageMetadataOverrides;
}

export interface LocalizedNamespaceMetadataOptions {
  url: LocalizedPageUrlOptions;
  namespace: string;
}

const DEFAULT_SITE_ICONS = [
  { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
  { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
  { rel: 'icon', type: 'image/ico', url: '/favicon.ico' },
  { rel: 'apple-touch-icon', sizes: '180x180', url: '/favicon-180x180.png' },
  { rel: 'android-chrome', sizes: '512x512', url: '/favicon-512x512.png' },
];

function buildAlternateUrls(options: LocalizedPageUrlOptions) {
  const { baseUrl, defaultLocale, locale, localePrefixAsNeeded, locales, pathname } = options;
  const canonicalPath = getAsNeededLocalizedUrl(locale, pathname, localePrefixAsNeeded, defaultLocale);
  const canonical = `${baseUrl}${canonicalPath}`;
  const languages = Object.fromEntries(
    locales.map((siteLocale) => [
      siteLocale,
      `${baseUrl}${getAsNeededLocalizedUrl(siteLocale, pathname, localePrefixAsNeeded, defaultLocale)}`,
    ]),
  );

  return {
    canonical,
    languages,
  };
}

function getOptionalTranslation(
  t: Awaited<ReturnType<typeof getTranslations>>,
  key: string,
): string | undefined {
  return t.has(key) ? t(key) : undefined;
}

function getAbsoluteUrl(baseUrl: string, value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

function getImageUrls(baseUrl: string, value?: string | string[]): { url: string }[] | undefined {
  if (!value) return undefined;
  const urls = Array.isArray(value) ? value : [value];
  const cleaned = urls.map((item) => item.trim()).filter(Boolean);
  return cleaned.length > 0
    ? cleaned.map((url) => ({ url: getAbsoluteUrl(baseUrl, url) }))
    : undefined;
}

function getEnvText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function resolveMetadataOverrides(options: {
  locale: string;
  namespace: string;
}): Promise<LocalizedPageMetadataOverrides> {
  const { locale, namespace } = options;
  const t = await getTranslations({ locale, namespace });
  const ogType = getEnvText(process.env.NEXT_PUBLIC_OG_TYPE);
  const xSiteName = getEnvText(process.env.NEXT_PUBLIC_X_SITE_NAME);
  const baseUrl = getEnvText(process.env.NEXT_PUBLIC_BASE_URL) ?? '';

  return {
    title: getOptionalTranslation(t, 'title'),
    description: getOptionalTranslation(t, 'description'),
    keywords: getOptionalTranslation(t, 'keywords'),
    openGraph: {
      ...(ogType ? { type: ogType as any } : {}),
      title: getOptionalTranslation(t, 'openGraph.title'),
      description: getOptionalTranslation(t, 'openGraph.description'),
      images: getImageUrls(
        baseUrl,
        getOptionalTranslation(t, 'openGraph.image') ?? getOptionalTranslation(t, 'openGraph.images'),
      ),
    },
    twitter: {
      ...(xSiteName ? { site: xSiteName } : {}),
      title: getOptionalTranslation(t, 'twitter.title'),
      description: getOptionalTranslation(t, 'twitter.description'),
      images: getImageUrls(
        baseUrl,
        getOptionalTranslation(t, 'twitter.image') ?? getOptionalTranslation(t, 'twitter.images'),
      ),
    },
  };
}

export async function createLocalizedSiteMetadata(
  options: CreateLocalizedSiteMetadataOptions,
): Promise<LocalizedSiteMetadata> {
  const { locale } = options;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('webTitle'),
    description: t('webDescription'),
    keywords: t('keywords'),
    icons: DEFAULT_SITE_ICONS,
  };
}

export function createLocalizedPageMetadata(
  options: CreateLocalizedPageMetadataOptions,
): Metadata {
  const { page, site, url } = options;
  const { baseUrl } = url;
  const alternates = buildAlternateUrls(url);
  const openGraph = {
    ...site?.openGraph,
    ...page?.openGraph,
    url: alternates.canonical,
  } as Metadata['openGraph'];
  const twitter = {
    ...site?.twitter,
    ...page?.twitter,
  } as Metadata['twitter'];

  return {
    metadataBase: new URL(baseUrl),
    title: page?.title ?? site?.title,
    description: page?.description ?? site?.description,
    keywords: page?.keywords ?? site?.keywords,
    icons: page?.icons ?? site?.icons,
    openGraph,
    twitter,
    robots: page?.robots,
    authors: page?.authors,
    creator: page?.creator,
    publisher: page?.publisher,
    category: page?.category,
    alternates,
  };
}

export async function createLocalizedMetadata(
  options: LocalizedNamespaceMetadataOptions,
): Promise<Metadata> {
  const { namespace, url } = options;
  const site = await createLocalizedSiteMetadata(url);
  const page = await resolveMetadataOverrides({
    locale: url.locale,
    namespace,
  });

  return createLocalizedPageMetadata({
    url,
    site,
    page,
  });
}
