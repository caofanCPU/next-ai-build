import type { ReactNode } from 'react';
import { getLegalSource } from '@/lib/source-legal';
import { SiteDocsLayout } from '@third-ui/fuma/base';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;
  const legalSource = await getLegalSource();
 
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
