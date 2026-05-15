import { appConfig } from '@/lib/appConfig';
import { siteDocs } from '@/lib/site-docs';
import { createFumaPage } from '@third-ui/fuma/server/page-generator';
import { LLMCopyButton } from '@third-ui/fuma/mdx/toc-base';

const sourceKey = 'docs';
const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  sourceKey: sourceKey,
  mdxContentSource: () => siteDocs.getContentSource(sourceKey),
  getMDXComponents: siteDocs.getMDXComponents,
  githubBaseUrl: appConfig.githubBaseUrl,
  copyButtonComponent: <LLMCopyButton />,
  showBreadcrumb: false,
  showTableOfContent: true,
  showTableOfContentPopover: false,
  tocRenderMode: 'fumadocs-clerk'
});

export default Page;
export { generateMetadata, generateStaticParams };
