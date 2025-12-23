import { appConfig, generatedLocales, localePrefixAsNeeded, defaultLocale } from "@/lib/appConfig";
import { getFumaTranslations } from '@third-ui/fuma/server';
import { NProgressBar } from '@third-ui/main/nprogress-bar';
import { RootProvider } from "fumadocs-ui/provider/next";
import { ClerkProviderClient } from '@third-ui/clerk';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { montserrat } from "@/lib/fonts";
import { cn } from '@windrun-huaiin/lib/utils';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import './globals.css';
import React from 'react';

export const dynamic = 'force-dynamic'

// 网站元数据
export async function generateMetadata({
  params: paramsPromise
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await paramsPromise;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('webTitle'),
    description: t('webDescription'),
    keywords: t('keywords'),
    alternates: {
      canonical: `${appConfig.baseUrl}${getAsNeededLocalizedUrl(locale, '/', localePrefixAsNeeded, defaultLocale)}`,
      languages: {
        "en": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('en', '/', localePrefixAsNeeded, defaultLocale)}`,
        "zh": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('zh', '/', localePrefixAsNeeded, defaultLocale)}`,
        "ja": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('ja', '/', localePrefixAsNeeded, defaultLocale)}`,
        "ko": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('ko', '/', localePrefixAsNeeded, defaultLocale)}`,
        "fr": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('fr', '/', localePrefixAsNeeded, defaultLocale)}`,
        "de": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('de', '/', localePrefixAsNeeded, defaultLocale)}`,
        "es": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('es', '/', localePrefixAsNeeded, defaultLocale)}`,
        "it": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('it', '/', localePrefixAsNeeded, defaultLocale)}`,
        "pt": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('pt', '/', localePrefixAsNeeded, defaultLocale)}`,
        "tr": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('tr', '/', localePrefixAsNeeded, defaultLocale)}`,
        "pl": `${appConfig.baseUrl}${getAsNeededLocalizedUrl('pl', '/', localePrefixAsNeeded, defaultLocale)}`,
      }
    },
    icons: [
      { rel: "icon", type: 'image/png', sizes: "16x16", url: "/favicon-16x16.png" },
      { rel: "icon", type: 'image/png', sizes: "32x32", url: "/favicon-32x32.png" },
      { rel: "icon", type: 'image/ico', url: "/favicon.ico" },
      { rel: "apple-touch-icon", sizes: "180x180", url: "/favicon-180x180.png" },
      { rel: "android-chrome", sizes: "512x512", url: "/favicon-512x512.png" },
    ]
  }
}

export default async function RootLayout({
  children,
  params: paramsPromise  // 重命名参数
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  console.log('RootLayout-React version:', React.version);
  const { locale } = await paramsPromise;  // 使用新名称
  setRequestLocale(locale);
  const messages = await getMessages();
  const fumaTranslations = await getFumaTranslations(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <NextIntlClientProvider messages={messages}>
        <body className={cn(montserrat.className)}>
          <NProgressBar />
          <ClerkProviderClient locale={locale} localePrefixAsNeeded={localePrefixAsNeeded} defaultLocale={defaultLocale}>
            <RootProvider
                i18n={{
                  locale: locale,
                  // available languages
                  locales: generatedLocales,
                  // translations for UI
                  translations: fumaTranslations,
                }}
            >
              {children}
            </RootProvider>
          </ClerkProviderClient>
        </body>
      </NextIntlClientProvider>
    </html>
  )
}
