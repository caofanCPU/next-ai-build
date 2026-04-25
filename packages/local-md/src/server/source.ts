import type { StandardSchemaV1 } from '@standard-schema/spec';
import { loader, type LoaderOptions, type MetaData, type PageData, type StaticSource } from 'fumadocs-core/source';
import type { I18nConfig } from 'fumadocs-core/i18n';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { localMd, type LocalMarkdownConfig } from '../core';

type BodyComponent = (props: { components?: MDXComponents }) => Promise<ReactNode>;

type RenderResult = {
  body: ReactNode;
  toc: LoaderPageData['toc'];
  structuredData: LoaderPageData['structuredData'];
  exports: Record<string, unknown>;
};

type LoaderPageData = PageData & {
  toc?: any[];
  structuredData?: any;
};

type LegacyDocData<Frontmatter> = Frontmatter &
  LoaderPageData & {
    body: BodyComponent;
    load: (components?: MDXComponents) => Promise<RenderResult>;
  };

export interface CreateLocalMdSourceLoaderOptions<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
> extends Omit<LocalMarkdownConfig<FrontmatterSchema, MetaSchema>, 'dir'> {
  sourceKey?: string;
  dir?: string;
  baseUrl?: string;
  sourceRootDir?: string;
  i18n: I18nConfig;
  icon?: LoaderOptions['icon'];
}

export interface ConfiguredLocalMdSourceFactoryOptions<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
> extends Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'sourceKey' | 'dir' | 'baseUrl'> {
  sourceRootDir?: string;
}

type LocalMdLoaderResult = Awaited<ReturnType<typeof createLocalMdSourceLoader>>;
type LocalMdLoaderPromise = Promise<LocalMdLoaderResult>;

function isLocalMdCacheDisabled() {
  return process.env.LOCAL_MD_CACHE_DISABLE?.toLowerCase() === 'true';
}

function isLocalMdDebugEnabled() {
  return process.env.LOCAL_MD_DEBUG?.toLowerCase() === 'true';
}

function shouldCacheEmptySource() {
  return process.env.LOCAL_MD_CACHE_EMPTY?.toLowerCase() === 'true';
}

function logLocalMdDebug(message: string, details?: Record<string, unknown>) {
  if (!isLocalMdDebugEnabled()) return;

  if (details) {
    console.log(`[local-md] ${message}`, details);
    return;
  }

  console.log(`[local-md] ${message}`);
}

function logLocalMdWarn(message: string, details?: Record<string, unknown>) {
  console.warn(`[local-md] ${message}`, details ?? {});
}

function countSourceFiles(
  source: StaticSource<{ pageData: PageData; metaData: MetaData }>,
) {
  let pageFileCount = 0;
  let metaFileCount = 0;

  for (const file of source.files) {
    if (file.type === 'page') pageFileCount += 1;
    if (file.type === 'meta') metaFileCount += 1;
  }

  return {
    sourceFileCount: source.files.length,
    pageFileCount,
    metaFileCount,
  };
}

function countLocaleTreeChildren(tree: unknown) {
  if (!tree || typeof tree !== 'object') return {};

  return Object.fromEntries(
    Object.entries(tree as Record<string, unknown>).map(([locale, node]) => {
      const children = Array.isArray((node as { children?: unknown[] } | null)?.children)
        ? (node as { children: unknown[] }).children.length
        : 0;

      return [locale, children];
    }),
  );
}

function countLocalePages(result: LocalMdLoaderResult) {
  const pages = ((result as unknown) as Record<string, unknown>).pages as Record<string, unknown> | undefined;
  if (!pages || typeof pages !== 'object') return {};

  return Object.fromEntries(
    Object.entries(pages).map(([locale, entries]) => [
      locale,
      Array.isArray(entries) ? entries.length : 0,
    ]),
  );
}

function isLoaderResultEmpty(result: LocalMdLoaderResult) {
  const pageTreeCounts = Object.values(countLocaleTreeChildren(result.pageTree)).filter(
    (value): value is number => typeof value === 'number',
  );
  const pageCounts = Object.values(countLocalePages(result)).filter(
    (value): value is number => typeof value === 'number',
  );

  return (
    pageTreeCounts.every((count) => count === 0) &&
    pageCounts.every((count) => count === 0)
  );
}

function resolveSourceDir(
  sourceKey: string,
  dir: string | undefined,
  sourceRootDir: string | undefined,
) {
  if (dir) return dir;
  const rootDir = sourceRootDir?.replace(/\/+$/, '') ?? 'src/mdx';
  return `${rootDir}/${sourceKey}`;
}

function resolveBaseUrl(sourceKey: string, baseUrl: string | undefined) {
  return baseUrl ?? `/${sourceKey}`;
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

async function createRuntimeSource<
  FrontmatterSchema extends StandardSchemaV1,
  MetaSchema extends StandardSchemaV1,
>(
  sourceKey: string,
  dir: string,
  config: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'sourceKey' | 'dir' | 'baseUrl' | 'sourceRootDir' | 'i18n' | 'icon'>,
): Promise<StaticSource<{ pageData: LegacyDocData<Record<string, unknown>>; metaData: MetaData }>> {
  logLocalMdDebug('createRuntimeSource:start', {
    sourceKey,
    resolvedDir: dir,
    processCwd: process.cwd(),
  });

  const instance = localMd({
    dir,
    ...config,
  });

  const source = await instance.staticSource();
  logLocalMdDebug('createRuntimeSource:static-source', {
    sourceKey,
    resolvedDir: dir,
    processCwd: process.cwd(),
    ...countSourceFiles(source),
  });

  type SourceFile = (typeof source.files)[number];
  const files = await Promise.all(
    source.files.map(async (file: SourceFile) => {
      if (file.type === 'meta') {
        return file;
      }

      const page = file.data;
      let rendererPromise: ReturnType<typeof page.load> | undefined;
      const frontmatter = toRecord(page.frontmatter);

      const data: LegacyDocData<Record<string, unknown>> = {
        ...frontmatter,
        title: page.title,
        description: page.description,
        icon: page.icon,
        body: async ({ components }) => {
          const rendered = await data.load(components);
          return rendered.body;
        },
        load: async (components) => {
          rendererPromise ??= page.load();
          const renderer = await rendererPromise;
          const rendered = await renderer.render(components);

          return {
            body: rendered.body,
            toc: rendered.toc,
            structuredData: renderer.structuredData,
            exports: (rendered.exports ?? {}) as Record<string, unknown>,
          };
        },
      };

      return {
        ...file,
        data,
      };
    }),
  );

  return {
    files,
  };
}

export async function createLocalMdSourceLoader<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  options: CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>,
) {
  const {
    sourceKey = 'docs',
    dir,
    baseUrl,
    sourceRootDir,
    i18n,
    icon,
    ...localMdConfig
  } = options;

  const resolvedDir = resolveSourceDir(sourceKey, dir, sourceRootDir);
  const resolvedBaseUrl = resolveBaseUrl(sourceKey, baseUrl);
  logLocalMdDebug('createLocalMdSourceLoader:start', {
    sourceKey,
    resolvedDir,
    baseUrl: resolvedBaseUrl,
    processCwd: process.cwd(),
    isLocalMdCacheDisabled: isLocalMdCacheDisabled(),
  });
  const source = await createRuntimeSource(sourceKey, resolvedDir, localMdConfig);
  const sourceCounts = countSourceFiles(source);
  logLocalMdDebug('createLocalMdSourceLoader:before-loader', {
    sourceKey,
    resolvedDir,
    baseUrl: resolvedBaseUrl,
    processCwd: process.cwd(),
    ...sourceCounts,
  });

  const result = loader({
    i18n,
    baseUrl: resolvedBaseUrl,
    source,
    ...(icon ? { icon } : {}),
  });

  const pageTreeLocaleCounts = countLocaleTreeChildren(result.pageTree);
  const localePageCounts = countLocalePages(result);
  logLocalMdDebug('createLocalMdSourceLoader:after-loader', {
    sourceKey,
    resolvedDir,
    baseUrl: resolvedBaseUrl,
    processCwd: process.cwd(),
    ...sourceCounts,
    localePageCounts,
    pageTreeLocaleCounts,
  });

  if (sourceCounts.pageFileCount === 0 || isLoaderResultEmpty(result)) {
    logLocalMdWarn('source loader produced empty pages', {
      sourceKey,
      resolvedDir,
      baseUrl: resolvedBaseUrl,
      processCwd: process.cwd(),
      ...sourceCounts,
      localePageCounts,
      pageTreeLocaleCounts,
    });
  }

  return result;
}

export function createCachedLocalMdSourceLoader<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  options: CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>,
) {
  let cached: LocalMdLoaderPromise | undefined;

  return function getLocalMdSource() {
    if (isLocalMdCacheDisabled()) {
      logLocalMdDebug('createCachedLocalMdSourceLoader:cache-disabled', {
        sourceKey: options.sourceKey ?? 'docs',
      });
      return createLocalMdSourceLoader(options);
    }

    if (cached) {
      logLocalMdDebug('createCachedLocalMdSourceLoader:cache-hit', {
        sourceKey: options.sourceKey ?? 'docs',
      });
      return cached;
    }

    logLocalMdDebug('createCachedLocalMdSourceLoader:cache-miss', {
      sourceKey: options.sourceKey ?? 'docs',
    });
    cached = createLocalMdSourceLoader(options);
    return cached;
  };
}

export function createConfiguredLocalMdSourceFactory<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  options: ConfiguredLocalMdSourceFactoryOptions<FrontmatterSchema, MetaSchema>,
) {
  const cache = new Map<string, LocalMdLoaderPromise>();

  return {
    async getSource(
      sourceKey: string,
      overrides: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'i18n' | 'icon' | 'sourceRootDir'> = {},
    ) {
      return createLocalMdSourceLoader({
        ...options,
        ...overrides,
        sourceKey,
      });
    },
    async getCachedSource(
      sourceKey: string,
      overrides: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'i18n' | 'icon' | 'sourceRootDir'> = {},
    ) {
      const resolvedDir = resolveSourceDir(sourceKey, overrides.dir, options.sourceRootDir);
      const resolvedBaseUrl = resolveBaseUrl(sourceKey, overrides.baseUrl);
      const cacheKey = `${sourceKey}:${resolvedDir}:${resolvedBaseUrl}`;

      if (isLocalMdCacheDisabled()) {
        logLocalMdDebug('getCachedSource:cache-disabled', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
        });
        return createLocalMdSourceLoader({
          ...options,
          ...overrides,
          sourceKey,
        });
      }

      const existing = cache.get(cacheKey);
      if (existing) {
        logLocalMdDebug('getCachedSource:cache-hit', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
        });
        return existing;
      }

      logLocalMdDebug('getCachedSource:cache-miss', {
        sourceKey,
        cacheKey,
        resolvedDir,
        baseUrl: resolvedBaseUrl,
        processCwd: process.cwd(),
        isLocalMdCacheDisabled: isLocalMdCacheDisabled(),
      });

      const created = createLocalMdSourceLoader({
          ...options,
          ...overrides,
          sourceKey,
        });
      const result = await created;
      const empty = isLoaderResultEmpty(result);

      logLocalMdDebug('getCachedSource:created', {
        sourceKey,
        cacheKey,
        resolvedDir,
        baseUrl: resolvedBaseUrl,
        processCwd: process.cwd(),
        empty,
        localePageCounts: countLocalePages(result),
        pageTreeLocaleCounts: countLocaleTreeChildren(result.pageTree),
      });

      if (empty && !shouldCacheEmptySource()) {
        logLocalMdWarn('skip caching empty source result', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
        });
        return result;
      }

      if (empty) {
        logLocalMdWarn('caching empty source result because LOCAL_MD_CACHE_EMPTY=true', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
        });
      }

      cache.set(cacheKey, Promise.resolve(result));

      return result;
    },
  };
}
