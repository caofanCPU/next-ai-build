import { appConfig, generatedLocales, localePrefixAsNeeded, defaultLocale, themeMode } from "@/lib/appConfig";
import { getFumaTranslations } from '@third-ui/fuma/fuma-translate-util';
import { createLocalizedPageMetadata, createLocalizedSiteMetadata } from '@third-ui/lib/seo-metadata';
import { NProgressBar } from '@third-ui/main/nprogress-bar';
import { DocsRootProvider } from '@third-ui/fuma/base/docs-root-provider';
import { ClerkProviderClient } from '@third-ui/clerk';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { montserrat } from "@/lib/fonts";
import { cn } from '@lib/utils';
import './globals.css';
import React from 'react';

// 7 days
export const revalidate = 604800;

export function generateStaticParams() {
  return appConfig.i18n.locales.map((locale) => ({ locale }));
}

// Site metadata.
export async function generateMetadata({
  params: paramsPromise
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await paramsPromise;
  const siteMetadata = await createLocalizedSiteMetadata({
    locale,
    baseUrl: appConfig.baseUrl,
    locales: appConfig.i18n.locales,
    defaultLocale,
    localePrefixAsNeeded,
  });
  return createLocalizedPageMetadata({
    url: {
      locale,
      pathname: '/',
      baseUrl: appConfig.baseUrl,
      locales: appConfig.i18n.locales,
      defaultLocale,
      localePrefixAsNeeded,
    },
    site: siteMetadata,
  });
}

export default async function RootLayout({
  children,
  params: paramsPromise  // Rename the parameter.
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await paramsPromise;  // Use the renamed parameter.
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
              theme={{
                mode: themeMode,
              }}
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
        {/* GoogleAnalysisScript Or MicrosoftAnalysisScript */}
      </NextIntlClientProvider>
    </html>
  )
}
