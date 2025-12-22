/**
 * @license
 * MIT License
 * Copyright (c) 2025 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { baseOptions } from '@/app/[locale]/layout.config';
import { fingerprintConfig } from '@windrun-huaiin/backend-core/lib';
import { FingerprintProvider } from '@third-ui/clerk/fingerprint';
import { CustomHomeLayout } from '@third-ui/fuma/base';
import { type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { ReactNode } from 'react';
import { clerkPageBanner, localPrefixAsNeeded, defaultLocale } from '@/lib/appConfig';

async function homeOptions(locale: string): Promise<HomeLayoutProps>{
  const resolvedBaseOptions = await baseOptions(locale);
  return {
    ...resolvedBaseOptions,
  };
}

export default async function RootLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const customeOptions = await homeOptions(locale);

  const homeLayoutOptions: HomeLayoutProps = {
    ...customeOptions,
    searchToggle: {
      enabled: false,
    },
    themeSwitch: {
      enabled: true,
      mode: 'light-dark-system',
    },
  };
  return (
    <FingerprintProvider config={fingerprintConfig}>
      <CustomHomeLayout
          locale={locale}
          localPrefixAsNeeded={localPrefixAsNeeded}
          defaultLocale={defaultLocale}
          options={homeLayoutOptions}
          showBanner={clerkPageBanner}
          showFooter={false}
          showGoToTop={false}
          floatingNav={true}
        >
          {children}
        </CustomHomeLayout>
    </FingerprintProvider>
  );
}
