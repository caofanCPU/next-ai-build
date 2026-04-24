import { baseOptions, homeNavLinks, levelNavLinks } from '@/app/[locale]/layout.config';
import { showBanner, localePrefixAsNeeded, defaultLocale } from '@/lib/appConfig';
import { fingerprintConfig } from '@windrun-huaiin/backend-core/lib';
import { FingerprintProvider } from '@third-ui/clerk/fingerprint';
import { SiteHomeLayout, type SiteHomeLayoutConfig } from '@third-ui/fuma/base';
import type { ReactNode } from 'react';

async function homeOptions(locale: string): Promise<SiteHomeLayoutConfig> {
  return {
    ...(await baseOptions(locale)),
    links: [
      ...(await homeNavLinks(locale)),
      ...(await levelNavLinks(locale)),
    ]
  };
}

export default async function Layout({
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
          showBanner,
          floatingNav: true,
          actionOrders: {
            desktop: ['search', 'theme', 'github', 'i18n', 'secondary'],
            mobileBar: ['search', 'pinned', 'menu'],
            mobileMenu: ['theme', 'i18n', 'separator', 'secondary', 'github'],
          },
        }}
      >
        {children}
      </SiteHomeLayout>
    </FingerprintProvider>
  );
}
