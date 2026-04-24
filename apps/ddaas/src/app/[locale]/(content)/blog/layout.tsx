import type { ReactNode } from 'react';
import { getBlogSource } from '@/lib/source-blog';
import { SiteDocsLayout } from '@third-ui/fuma/base';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const blogSource = await getBlogSource();
  return (
    <SiteDocsLayout
      config={{
        tree: blogSource.getPageTree(locale),
        sidebar: { enabled: false },
        searchToggle: { enabled: false },
      }}
    >
      {children}
    </SiteDocsLayout>
  );
}
