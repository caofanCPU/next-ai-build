import { baseOptions } from '@/app/[locale]/layout.config';
import { levelNavLinks, primaryNavLinks } from '@/app/[locale]/layout.nav';
import { homeHeavyItems } from './layout.heavy';
import { showBanner, localePrefixAsNeeded, defaultLocale } from '@/lib/appConfig';
import { i18n } from '@/lib/i18n-base';
import { fingerprintConfig } from '@windrun-huaiin/backend-core/config/fingerprint';
import { FingerprintProvider } from '@third-ui/clerk/fingerprint';
import { SiteHomeLayout, type SiteHomeLayoutConfig } from '@third-ui/fuma/base';
import type { ReactNode } from 'react';

async function homeOptions(locale: string): Promise<SiteHomeLayoutConfig> {
  return {
      ...(await baseOptions(locale)),
      links: [
        ...(await primaryNavLinks(locale)),
        ...(await levelNavLinks(locale)),
        ...(await homeHeavyItems(locale)),
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
    i18n,
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
