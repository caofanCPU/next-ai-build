import { appConfig } from '@/lib/appConfig';
import { siteDocs } from '@/lib/site-docs';
import { createFumaPage } from '@third-ui/fuma/server/page-generator';
import { LLMCopyButton } from '@third-ui/fuma/mdx/toc-base';

const BLOG_SOURCE_KEY = 'blog';
const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  sourceKey: BLOG_SOURCE_KEY,
  mdxContentSource: () => siteDocs.getContentSource(BLOG_SOURCE_KEY),
  getMDXComponents: siteDocs.getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir[BLOG_SOURCE_KEY],
  githubBaseUrl: appConfig.githubBaseUrl,
  copyButtonComponent: <LLMCopyButton />,
  showBreadcrumb: false,
  showTableOfContent: true,
  showTableOfContentPopover: false,
  tocRenderMode: 'portable-clerk',
});

export default Page;
export { generateMetadata, generateStaticParams };
