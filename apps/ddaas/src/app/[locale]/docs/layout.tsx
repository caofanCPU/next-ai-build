import { baseOptions } from '@/app/[locale]/layout.config';
import { getDocsSource } from '@/lib/source-docs';
import type { ReactNode } from 'react';
// https://fumadocs.dev/docs/ui/layouts/notebook
import { FumaGithubInfo } from '@third-ui/fuma/mdx';
import { DocsLayout, type DocsLayoutProps } from 'fumadocs-ui/layouts/docs';
import { appConfig } from '@/lib/appConfig';

async function docsOptions(locale: string): Promise<DocsLayoutProps> {
  const docsSource = await getDocsSource();
  const options = await baseOptions(locale);
  return {
    ...options,
    tree: docsSource.getPageTree(locale),
    links: [
      {
        type: 'custom',
        children: (
          <FumaGithubInfo 
            owner="caofanCPU" 
            repo="D8gerAutoCode" 
            token={appConfig.githubInfoToken}
            className="lg:-mx-2" 
          />
        ),
      },
    ],
    sidebar: {
      // 禁用侧边栏Link组件预加载, 降低服务端负荷, 并尽可能降低触发云平台限流规则的概率
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
    <DocsLayout {...customeOptions} 
      themeSwitch={{
        enabled: true,
        mode: 'light-dark-system',
      }}
      sidebar={{ enabled: true }}
      searchToggle={{enabled: false}}
    >
      {children}
    </DocsLayout>
  );
}
