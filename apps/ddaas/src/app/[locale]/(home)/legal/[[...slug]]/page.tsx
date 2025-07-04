import { getMDXComponents } from '@/components/mdx-components';
import { appConfig } from '@/lib/appConfig';
import { SiteIcon } from '@/lib/site-config';
import { legalSource } from '@/lib/source';
import { NotFoundPage } from '@base-ui/components';
import { createFumaPage } from '@third-ui/fuma/server';

const { Page, generateStaticParams, generateMetadata } = createFumaPage({
  mdxContentSource: legalSource,
  getMDXComponents,
  mdxSourceDir: appConfig.mdxSourceDir.legal,
  githubBaseUrl: appConfig.githubBaseUrl,
  showCopy: false,
  siteIcon: <SiteIcon />,
  FallbackPage: NotFoundPage,
});

export default Page;
export { generateMetadata, generateStaticParams };
