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
  dir: string,
  config: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'sourceKey' | 'dir' | 'baseUrl' | 'sourceRootDir' | 'i18n' | 'icon'>,
): Promise<StaticSource<{ pageData: LegacyDocData<Record<string, unknown>>; metaData: MetaData }>> {
  const instance = localMd({
    dir,
    ...config,
  });

  const source = await instance.staticSource();
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
  const source = await createRuntimeSource(resolvedDir, localMdConfig);

  return loader({
    i18n,
    baseUrl: resolvedBaseUrl,
    source,
    ...(icon ? { icon } : {}),
  });
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
      return createLocalMdSourceLoader(options);
    }

    cached ??= createLocalMdSourceLoader(options);
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
        return createLocalMdSourceLoader({
          ...options,
          ...overrides,
          sourceKey,
        });
      }

      const existing = cache.get(cacheKey);
      if (existing) {
        return existing;
      }

      const created = createLocalMdSourceLoader({
          ...options,
          ...overrides,
          sourceKey,
        });
      cache.set(cacheKey, created);

      return created;
    },
  };
}
