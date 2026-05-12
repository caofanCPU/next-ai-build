import { appConfig } from '@/lib/appConfig';
import { siteDocs } from '@/lib/site-docs';
import { createFumaPage } from '@third-ui/fuma/server/page-generator';
import { LLMCopyButton } from '@third-ui/fuma/mdx/toc-base';

const sourceKey = 'blog';
const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  sourceKey: sourceKey,
  mdxContentSource: () => siteDocs.getContentSource('blog'),
  getMDXComponents: siteDocs.getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir[sourceKey],
  githubBaseUrl: appConfig.githubBaseUrl,
  copyButtonComponent: <LLMCopyButton />,
  showBreadcrumb: false,
  showTableOfContent: true,
  showTableOfContentPopover: false,
  tocRenderMode: 'portable-clerk'
});

export default Page;
export { generateMetadata, generateStaticParams };
