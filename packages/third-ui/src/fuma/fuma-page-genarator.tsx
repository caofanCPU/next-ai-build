import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { ReactNode, ReactElement, cloneElement } from 'react';
import { TocFooterWrapper } from '@third-ui/fuma/mdx/toc-footer-wrapper';
import type { LLMCopyButtonProps, LLMCopyButton } from '@third-ui/fuma/mdx/toc-base';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';

interface FumaPageParams {
  /* 
   * The source key of the mdx content, used to generate the edit path
   */
  sourceKey: string;
  /* 
   * The source of the mdx content
   */
  mdxContentSource: any;
  /* 
   * The  mdx components handler, refer to fumadocs 
   */
  getMDXComponents: () => any;
  /* 
   * The source directory of the mdx content, used to generate the edit path
   */
  mdxSourceDir: string;
  /* 
   * The github base url, used to generate the edit path, if not provided, the edit path will not be shown
   */
  githubBaseUrl?: string;
  /* 
   * The copy button component, must be LLMCopyButton
   */
  copyButtonComponent?: ReactElement<LLMCopyButtonProps, typeof LLMCopyButton>;
  /* 
   * The site icon component to use in NotFoundPage
   */
  siteIcon: ReactNode;
  /* 
   * The fallback page component to use when the page is not found
   */
  FallbackPage: React.ComponentType<{ siteIcon: ReactNode }>;
  /*
   * Supported locales for generating alternates metadata, defaults to ['en']
   */
  supportedLocales?: string[];

  // default true
  showBreadcrumb?: boolean;

  // default true
  showTableOfContent?: boolean;

  // default false, for mobile style can cause issue
  showTableOfContentPopover?: boolean;

  /*
   * Whether localePrefix is set to 'as-needed' (default: true)
   */
  localPrefixAsNeeded?: boolean;

  /*
   * The default locale for the application (default: 'en')
   */
  defaultLocale?: string;
}

export function createFumaPage({
  sourceKey,
  mdxContentSource,
  getMDXComponents,
  mdxSourceDir,
  githubBaseUrl,
  copyButtonComponent,
  siteIcon,
  FallbackPage,
  supportedLocales = ['en'],
  showBreadcrumb = true,
  showTableOfContent = true,
  showTableOfContentPopover = false,
  localPrefixAsNeeded = true,
  defaultLocale = 'en',
}: FumaPageParams) {
  const Page = async function Page({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
    const { slug, locale } = await params;
    const page = mdxContentSource.getPage(slug, locale);
    if (!page) {
      console.log('[FumaPage] missing page', { slug, locale, available: mdxContentSource.pageTree?.[locale]?.children?.map((c: any) => c.url) });
      return <FallbackPage siteIcon={siteIcon} />;
    }

    const path = githubBaseUrl ? `${mdxSourceDir}/${page.path}` : undefined;
    const tocFooterElement = (
      <TocFooterWrapper
        lastModified={page.data.date}
        copyButtonComponent={
          copyButtonComponent
            ? cloneElement(copyButtonComponent, { sourceKey })
            : undefined
        }
        editPath={path}
        githubBaseUrl={githubBaseUrl}
      />
    );

    const MDX = page.data.body;
    return (
      <DocsPage
        breadcrumb={{enabled: showBreadcrumb}}
        tableOfContent={{
          enabled: showTableOfContent,
          style: 'clerk',
          single: false,
          footer: tocFooterElement,
        }}
        tableOfContentPopover={{
          enabled: showTableOfContentPopover,
          footer: tocFooterElement,
        }}
        toc={page.data.toc}
        article={{ className: 'max-sm:pb-16' }}
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
        <DocsBody className="text-fd-foreground/80">
          <MDX components={getMDXComponents()} />
        </DocsBody>
      </DocsPage>
    );
  };

  function generateStaticParams() {
    return mdxContentSource.generateParams('slug', 'locale');
  }

  async function generateMetadata(props: { params: Promise<{ slug?: string[]; locale?: string }> }) {
    const { slug, locale } = await props.params;
    const page = mdxContentSource.getPage(slug, locale);
    if (!page) {
      return {
        title: '404 - Page Not Found',
        description: 'This page could not be found.',
      };
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const baseRoute = mdxSourceDir.replace('src/mdx/', '');
    // build the current page path
    const currentPath = slug ? slug.join('/') : '';
    const localizedPath = getAsNeededLocalizedUrl(locale || defaultLocale, `/${baseRoute}${currentPath ? `/${currentPath}` : ''}`, localPrefixAsNeeded, defaultLocale);
    const currentUrl = `${baseUrl}${localizedPath}`;

    // generate the seo language map
    const seoLanguageMap: Record<string, string> = {};

    supportedLocales.forEach(loc => {
      const seoPath = getAsNeededLocalizedUrl(loc, `/${baseRoute}${currentPath ? `/${currentPath}` : ''}`, localPrefixAsNeeded, defaultLocale);
      seoLanguageMap[loc] = `${baseUrl}${seoPath}`;
    });

    return {
      metadataBase: new URL(baseUrl),
      title: page.data.title,
      description: page.data.description,
      alternates: {
        canonical: currentUrl,
        languages: seoLanguageMap
      },
    };
  }

  return {
    Page,
    generateStaticParams,
    generateMetadata,
  };
} 
