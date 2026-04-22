import type { ReactNode } from 'react';
import { getLegalSource } from '@/lib/source-legal';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

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
    <DocsLayout sidebar={{enabled: false}} searchToggle={{enabled: false}} tree={legalSource.getPageTree(locale)}>
      {children}
    </DocsLayout>
  );
}
