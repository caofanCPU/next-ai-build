import type { ReactNode } from 'react';
import { baseOptions } from '@/app/[locale]/layout.config';
import { levelNavLinks, primaryNavLinks } from '@/app/[locale]/layout.nav';
import { showBanner, localePrefixAsNeeded, defaultLocale } from '@/lib/appConfig';
import { getContentSource } from '@/lib/content-source';
import { SiteDocsLayout, SiteHomeLayout, type SiteHomeLayoutConfig } from '@third-ui/fuma/base';
import { appConfig } from '@/lib/appConfig';

async function contentOptions(locale: string): Promise<SiteHomeLayoutConfig> {
  return {
    ...(await baseOptions(locale)),
    links: [
      ...(await primaryNavLinks(locale)),
      ...(await levelNavLinks(locale)),
    ],
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
  const legalSource = await getContentSource('legal');
  const contentLayoutOptions = await contentOptions(locale);
  const homeLayoutOptions: SiteHomeLayoutConfig = {
    ...contentLayoutOptions,
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
    <SiteHomeLayout
      locale={locale}
      config={{
        ...homeLayoutOptions,
        localePrefixAsNeeded,
        defaultLocale,
        showBanner,
        showFooter: false,
        floatingNav: true,
        actionOrders: {
          desktop: ['search', 'theme', 'github', 'i18n', 'secondary'],
          mobileBar: ['search', 'pinned', 'menu'],
          mobileMenu: ['theme', 'i18n', 'separator', 'secondary', 'github'],
        },
      }}
    >
      <SiteDocsLayout
        config={{
          tree: legalSource.getPageTree(locale),
          sidebar: { enabled: false },
          searchToggle: { enabled: false },
        }}
      >
        {children}
      </SiteDocsLayout>
    </SiteHomeLayout>
  );
}
