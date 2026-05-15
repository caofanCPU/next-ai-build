import type { ReactNode } from 'react';
import { baseOptions } from '@/app/[locale]/layout.config';
import { levelNavLinks, primaryNavLinks } from '@/app/[locale]/layout.nav';
import { showBanner, localePrefixAsNeeded, defaultLocale, github } from '@/lib/appConfig';
import { i18n } from '@/lib/i18n-base';
import { siteDocs } from '@/lib/site-docs';
import { SiteDocsLayout } from '@third-ui/fuma/base/site-docs-layout';
import { SiteHomeLayout, type SiteHomeLayoutConfig } from '@third-ui/fuma/base/site-home-layout';

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
  const legalSource = await siteDocs.getContentSource('legal');
  const contentLayoutOptions = await contentOptions(locale);
  const homeLayoutOptions: SiteHomeLayoutConfig = {
    ...contentLayoutOptions,
    i18n,
    githubUrl: github,
    searchToggle: {
      enabled: false,
    },
    themeSwitch: {
      mode: 'light-only',
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
          themeProvider: false,
        }}
      >
        {children}
      </SiteDocsLayout>
    </SiteHomeLayout>
  );
}
