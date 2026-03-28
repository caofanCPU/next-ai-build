import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { NotFoundPage } from '@base-ui/components';
import { blogSource } from '@/lib/source-blog';
import { createFumaPage } from '@third-ui/fuma/server';
import { SiteIcon } from '@/lib/site-config';
import { LLMCopyButton } from '@third-ui/fuma/mdx/toc-base';

const sourceKey = 'blog';
const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  sourceKey: sourceKey,
  mdxContentSource: blogSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir[sourceKey],
  githubBaseUrl: appConfig.githubBaseUrl,
  copyButtonComponent: <LLMCopyButton />,
  siteIcon: <SiteIcon />,
  FallbackPage: NotFoundPage,
  showBreadcrumb: false,
  showTableOfContent: true,
  showTableOfContentPopover: false
});

export default Page;
export { generateStaticParams, generateMetadata };