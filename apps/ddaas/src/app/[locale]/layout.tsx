import { appConfig, generatedLocales } from "@/lib/appConfig";
import { getFumaTranslations } from '@third-ui/fuma/server';
import { NProgressBar } from '@third-ui/main/nprogress-bar';
import { RootProvider } from "fumadocs-ui/provider/next";
import { ClerkProviderClient } from '@third-ui/clerk';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { montserrat } from "@/lib/fonts";
import { cn } from '@windrun-huaiin/lib/utils';
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
    metadataBase: new URL(appConfig.baseUrl),
    alternates: {
      canonical: `${appConfig.baseUrl}/${locale}`,
      languages: {
        "en": `${appConfig.baseUrl}/en`,
        "zh": `${appConfig.baseUrl}/zh`,
        "ja": `${appConfig.baseUrl}/ja`,
        "ko": `${appConfig.baseUrl}/ko`,
        "fr": `${appConfig.baseUrl}/fr`,
        "de": `${appConfig.baseUrl}/de`,
        "es": `${appConfig.baseUrl}/es`,
        "it": `${appConfig.baseUrl}/it`,
        "pt": `${appConfig.baseUrl}/pt`,
        "tr": `${appConfig.baseUrl}/tr`,
        "pl": `${appConfig.baseUrl}/pl`,
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
          <ClerkProviderClient locale={locale}>
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
