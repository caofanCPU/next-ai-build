import { baseOptions } from '@/app/[locale]/layout.config';
import { siteDocs } from '@/lib/site-docs';
import type { ReactNode } from 'react';
import { FumaGithubInfo } from '@third-ui/fuma/mdx/fuma-github-info';
import { SiteDocsLayout, type SiteDocsLayoutConfig } from '@third-ui/fuma/base/site-docs-layout';
import { github } from '@/lib/appConfig';
import { i18n } from '@/lib/i18n-base';

async function docsOptions(locale: string): Promise<SiteDocsLayoutConfig> {
  const docsSource = await siteDocs.getContentSource('docs');
  const options = await baseOptions(locale);
  return {
    ...options,
    i18n,
    githubUrl: github,
    tree: docsSource.getPageTree(locale),
    links: [
      {
        type: 'custom',
        children: (
          <FumaGithubInfo 
            owner="caofanCPU" 
            repo="D8gerAutoCode" 
            className="lg:-mx-2" 
          />
        ),
      },
    ],
    sidebar: {
      // Disable sidebar Link prefetching to reduce server load and lower the chance of triggering cloud platform rate limits.
      prefetch: false,
    },
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
  const customeOptions = await docsOptions(locale);
 
  return (
    <SiteDocsLayout
      config={{
        ...customeOptions,
        themeSwitch: {
          enabled: true,
          mode: 'light-dark-system',
        },
        sidebar: { enabled: true },
        searchToggle: { enabled: false },
      }}
    >
      {children}
    </SiteDocsLayout>
  );
}
