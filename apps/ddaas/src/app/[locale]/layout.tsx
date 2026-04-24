import { appConfig, generatedLocales, localePrefixAsNeeded, defaultLocale } from "@/lib/appConfig";
import { getFumaTranslations } from '@third-ui/fuma/server';
import { createLocalizedSiteMetadata } from '@third-ui/lib/seo-metadata';
import { NProgressBar } from '@third-ui/main/nprogress-bar';
import { DocsRootProvider } from '@third-ui/fuma/base';
import { ClerkProviderClient } from '@third-ui/clerk';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { montserrat } from "@/lib/fonts";
import { cn } from '@windrun-huaiin/lib';
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
  return createLocalizedSiteMetadata({
    locale,
    baseUrl: appConfig.baseUrl,
    locales: appConfig.i18n.locales,
    defaultLocale,
    localePrefixAsNeeded,
  });
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
            <DocsRootProvider
              i18n={{
                locale: locale,
                locales: generatedLocales,
                translations: fumaTranslations,
              }}
            >
              {children}
            </DocsRootProvider>
          </ClerkProviderClient>
        </body>
      </NextIntlClientProvider>
    </html>
  )
}
