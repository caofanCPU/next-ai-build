import { baseOptions } from '@/app/[locale]/layout.config';
import { fingerprintConfig } from '@windrun-huaiin/backend-core/config/fingerprint';
import { FingerprintProvider } from '@third-ui/clerk/fingerprint';
import { SiteHomeLayout, type SiteHomeLayoutConfig } from '@third-ui/fuma/base';
import { ReactNode } from 'react';
import { clerkPageBanner, localePrefixAsNeeded, defaultLocale } from '@/lib/appConfig';
import { i18n } from '@/lib/i18n-base';
import { appConfig } from '@/lib/appConfig';

async function homeOptions(locale: string): Promise<SiteHomeLayoutConfig> {
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

  const homeLayoutOptions: SiteHomeLayoutConfig = {
    ...customeOptions,
    i18n,
    githubUrl: appConfig.github,
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
      <SiteHomeLayout
        locale={locale}
        config={{
          ...homeLayoutOptions,
          localePrefixAsNeeded,
          defaultLocale,
          showBanner: clerkPageBanner,
          showFooter: false,
          showGoToTop: false,
          floatingNav: true,
        }}
      >
        {children}
      </SiteHomeLayout>
    </FingerprintProvider>
  );
}
