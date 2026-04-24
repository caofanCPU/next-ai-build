import type { ReactNode } from 'react';
import { getContentSource } from '@/lib/content-source';
import { SiteDocsLayout } from '@third-ui/fuma/base';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const legalSource = await getContentSource('legal');
 
  return (
    <SiteDocsLayout
      config={{
        tree: legalSource.getPageTree(locale),
        sidebar: { enabled: false },
        searchToggle: { enabled: false },
      }}
    >
      {children}
    </SiteDocsLayout>
  );
}
