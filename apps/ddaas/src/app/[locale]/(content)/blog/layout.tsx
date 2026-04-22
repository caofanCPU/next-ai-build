import type { ReactNode } from 'react';
import { getBlogSource } from '@/lib/source-blog';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';

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
    <DocsLayout sidebar={{enabled: false}} searchToggle={{enabled: false}} tree={blogSource.getPageTree(locale)}>
      {children}
    </DocsLayout>
  );
}
