import { appConfig } from '@/lib/appConfig';
import { siteDocs } from '@/lib/site-docs';
import { createFumaPage } from '@third-ui/fuma/server/page-generator';

const sourceKey = 'legal';
const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  sourceKey: sourceKey,
  mdxContentSource: () => siteDocs.getContentSource('legal'),
  getMDXComponents: siteDocs.getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir[sourceKey],
  githubBaseUrl: appConfig.githubBaseUrl,
  supportedLocales: appConfig.i18n.locales as string[],
  showBreadcrumb: false,
  showTableOfContent: true,
  showTableOfContentPopover: false,
  tocRenderMode: 'fumadocs-normal'
});

export default Page;
export { generateMetadata, generateStaticParams };
