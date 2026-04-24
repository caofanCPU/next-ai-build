import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';

export interface CreateLocalizedSiteMetadataOptions {
  locale: string;
  baseUrl: string;
  locales: readonly string[];
  defaultLocale: string;
  localePrefixAsNeeded: boolean;
}

export type LocalizedSiteMetadata = Pick<
  Metadata,
  'title' | 'description' | 'keywords' | 'alternates' | 'icons'
>;

const DEFAULT_SITE_ICONS = [
  { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
  { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
  { rel: 'icon', type: 'image/ico', url: '/favicon.ico' },
  { rel: 'apple-touch-icon', sizes: '180x180', url: '/favicon-180x180.png' },
  { rel: 'android-chrome', sizes: '512x512', url: '/favicon-512x512.png' },
];

export async function createLocalizedSiteMetadata(
  options: CreateLocalizedSiteMetadataOptions,
): Promise<LocalizedSiteMetadata> {
  const { baseUrl, defaultLocale, locale, localePrefixAsNeeded, locales } = options;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('webTitle'),
    description: t('webDescription'),
    keywords: t('keywords'),
    alternates: {
      canonical: `${baseUrl}${getAsNeededLocalizedUrl(locale, '/', localePrefixAsNeeded, defaultLocale)}`,
      languages: Object.fromEntries(
        locales.map((siteLocale) => [
          siteLocale,
          `${baseUrl}${getAsNeededLocalizedUrl(siteLocale, '/', localePrefixAsNeeded, defaultLocale)}`,
        ]),
      ),
    },
    icons: DEFAULT_SITE_ICONS,
  };
}
