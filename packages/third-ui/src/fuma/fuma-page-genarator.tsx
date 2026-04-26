import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { ReactNode, ReactElement, cloneElement, type CSSProperties } from 'react';
import { TocFooterWrapper } from './mdx/toc-footer-wrapper';
import type { LLMCopyButtonProps, LLMCopyButton } from './mdx/toc-base';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { PortableClerkTOC, PortableClerkTOCTitle } from './mdx/toc-clerk-portable';
import { themeSvgIconColor } from '@windrun-huaiin/base-ui/lib';

export type FumaPageTocRenderMode =
  | 'portable-clerk'
  | 'fumadocs-clerk'
  | 'fumadocs-normal';

interface FumaPageParams {
  /* 
   * The source key of the mdx content, used to generate the edit path
   */
  sourceKey: string;
  /* 
   * The source of the mdx content
   */
  mdxContentSource: any | (() => Promise<any>);
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

  /*
   * Controls which TOC renderer is used.
   *
   * - portable-clerk: use @third-ui's custom Clerk-like TOC renderer.
   * - fumadocs-clerk: use fumadocs-ui's built-in clerk slot renderer.
   * - fumadocs-normal: use fumadocs-ui's built-in normal slot renderer.
   *
   * @defaultValue 'portable-clerk'
   */
  tocRenderMode?: FumaPageTocRenderMode;

  /*
   * @deprecated Mobile TOC popover is no longer used.
   */
  showTableOfContentPopover?: boolean;

  /*
   * Whether localePrefix is set to 'as-needed' (default: true)
   */
  localePrefixAsNeeded?: boolean;

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
  tocRenderMode = 'portable-clerk',
  showTableOfContentPopover = false,
  localePrefixAsNeeded = true,
  defaultLocale = 'en',
}: FumaPageParams) {
  const isLocalMdDebugEnabled = process.env.LOCAL_MD_DEBUG?.toLowerCase() === 'true';
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const durationMs = (startedAt: number) => Number((now() - startedAt).toFixed(1));
  const logFumaPageDebug = (message: string, details?: Record<string, unknown>) => {
    if (!isLocalMdDebugEnabled) return;
    console.log(`[fuma-page] ${message}`, details ?? {});
  };

  const getSource = async () => {
    if (typeof mdxContentSource === 'function') {
      return await mdxContentSource();
    }

    return mdxContentSource;
  };

  const Page = async function Page({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
    const pageStartedAt = now();
    const { slug, locale } = await params;
    const sourceStartedAt = now();
    const source = await getSource();
    logFumaPageDebug('page:source-ready', {
      sourceKey,
      locale,
      slug,
      durationMs: durationMs(sourceStartedAt),
    });

    const getPageStartedAt = now();
    const page = source.getPage(slug, locale);
    logFumaPageDebug('page:get-page', {
      sourceKey,
      locale,
      slug,
      found: Boolean(page),
      durationMs: durationMs(getPageStartedAt),
      totalElapsedMs: durationMs(pageStartedAt),
    });
    if (!page) {
      return (
        <DocsPage
          full
          breadcrumb={{ enabled: false }}
          footer={{ enabled: false }}
          tableOfContent={{ enabled: false }}
          tableOfContentPopover={{ enabled: false }}
          className="max-w-none px-0 py-0"
        >
          <FallbackPage siteIcon={siteIcon} />
        </DocsPage>
      );
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

    const content =
      typeof page.data.load === 'function'
        ? await (async () => {
            const loadStartedAt = now();
            const result = await page.data.load(getMDXComponents());
            logFumaPageDebug('page:load', {
              sourceKey,
              locale,
              slug,
              pagePath: page.path,
              durationMs: durationMs(loadStartedAt),
              totalElapsedMs: durationMs(pageStartedAt),
            });
            return result;
          })()
        : {
            body: await page.data.body({ components: getMDXComponents() }),
            toc: page.data.toc ?? [],
          };

    return (
      <DocsPage
        breadcrumb={{enabled: showBreadcrumb}}
        tableOfContent={resolveTableOfContentOptions({
          enabled: showTableOfContent,
          tocRenderMode,
          toc: content.toc,
          footer: tocFooterElement,
        })}
        tableOfContentPopover={{
          enabled: showTableOfContentPopover && tocRenderMode !== 'portable-clerk',
          style: tocRenderMode === 'fumadocs-clerk' ? 'clerk' : 'normal',
        }}
        toc={content.toc}
        className="max-sm:pb-16"
      >
        <DocsTitle>{page.data.title}</DocsTitle>
        <DocsDescription className="mb-2">{page.data.description}</DocsDescription>
        <DocsBody className="text-fd-foreground/80">
          {content.body}
        </DocsBody>
      </DocsPage>
    );
  };

  async function generateStaticParams() {
    const startedAt = now();
    const source = await getSource();
    const params = source.generateParams('slug', 'locale');
    logFumaPageDebug('generateStaticParams', {
      sourceKey,
      count: Array.isArray(params) ? params.length : undefined,
      durationMs: durationMs(startedAt),
    });
    return params;
  }

  async function generateMetadata(props: { params: Promise<{ slug?: string[]; locale?: string }> }) {
    const startedAt = now();
    const { slug, locale } = await props.params;
    const source = await getSource();
    const page = source.getPage(slug, locale);
    logFumaPageDebug('generateMetadata:get-page', {
      sourceKey,
      locale,
      slug,
      found: Boolean(page),
      durationMs: durationMs(startedAt),
    });
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
    const localizedPath = getAsNeededLocalizedUrl(locale || defaultLocale, `/${baseRoute}${currentPath ? `/${currentPath}` : ''}`, localePrefixAsNeeded, defaultLocale);
    const currentUrl = `${baseUrl}${localizedPath}`;

    // generate the seo language map
    const seoLanguageMap: Record<string, string> = {};

    supportedLocales.forEach(loc => {
      const seoPath = getAsNeededLocalizedUrl(loc, `/${baseRoute}${currentPath ? `/${currentPath}` : ''}`, localePrefixAsNeeded, defaultLocale);
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

function resolveTableOfContentOptions({
  enabled,
  tocRenderMode,
  toc,
  footer,
}: {
  enabled: boolean;
  tocRenderMode: FumaPageTocRenderMode;
  toc: any[];
  footer: ReactNode;
}) {
  if (tocRenderMode === 'portable-clerk') {
    return {
      enabled,
      single: false,
      component: (
        <PortableClerkTOC
          toc={toc}
          footer={footer}
        />
      ),
    };
  }

  const themedTocProps = {
    container: {
      className: '[--color-fd-primary:var(--third-ui-toc-primary)] [--color-fd-primary-foreground:var(--third-ui-toc-primary-foreground)] [&_#toc-title]:hidden',
      style: {
        '--third-ui-toc-primary': themeSvgIconColor,
        '--third-ui-toc-primary-foreground': '#ffffff',
      } as CSSProperties,
    },
    header: <PortableClerkTOCTitle />,
    footer,
  };

  if (tocRenderMode === 'fumadocs-clerk') {
    return {
      enabled,
      single: false,
      style: 'clerk',
      ...themedTocProps,
    } as const;
  }

  return {
    enabled,
    single: false,
    style: 'normal',
    ...themedTocProps,
  } as const;
}
