import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { LoaderOptions, MetaData, PageData, StaticSource } from 'fumadocs-core/source';
import type { I18nConfig } from 'fumadocs-core/i18n';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import type { LocalMarkdownConfig } from '../core';

export type BodyComponent = (props: { components?: MDXComponents }) => Promise<ReactNode>;

export type RenderResult = {
  body: ReactNode;
  toc: LoaderPageData['toc'];
  structuredData: LoaderPageData['structuredData'];
  exports: Record<string, unknown>;
};

export type LoaderPageData = PageData & {
  toc?: any[];
  structuredData?: any;
};

export type LegacyDocData<Frontmatter> = Frontmatter &
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
  mode?: 'auto' | 'runtime' | 'build';
  appRoot?: string;
}

export interface ConfiguredLocalMdSourceFactoryOptions<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
> extends Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'sourceKey' | 'dir' | 'baseUrl'> {
  sourceRootDir?: string;
}

export function isLocalMdCacheDisabled() {
  return process.env.LOCAL_MD_CACHE_DISABLE?.toLowerCase() === 'true';
}

export function shouldCacheEmptySource() {
  return process.env.LOCAL_MD_CACHE_EMPTY?.toLowerCase() === 'true';
}

export function countSourceFiles(
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

export function countLocaleTreeChildren(tree: unknown) {
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

export function countLocalePages(result: unknown) {
  const pages = (result as Record<string, unknown>).pages as Record<string, unknown> | undefined;
  if (!pages || typeof pages !== 'object') return {};

  return Object.fromEntries(
    Object.entries(pages).map(([locale, entries]) => [
      locale,
      Array.isArray(entries) ? entries.length : 0,
    ]),
  );
}

export function isLoaderResultEmpty(result: unknown) {
  const pageTreeCounts = Object.values(countLocaleTreeChildren((result as Record<string, unknown>).pageTree)).filter(
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

export function resolveSourceDir(
  sourceKey: string,
  dir: string | undefined,
  sourceRootDir: string | undefined,
) {
  if (dir) return dir;
  const rootDir = sourceRootDir?.replace(/\/+$/, '') ?? 'src/mdx';
  return `${rootDir}/${sourceKey}`;
}

export function resolveBaseUrl(sourceKey: string, baseUrl: string | undefined) {
  return baseUrl ?? `/${sourceKey}`;
}

export function resolveLocalMdMode(mode: CreateLocalMdSourceLoaderOptions['mode']) {
  if (mode && mode !== 'auto') return mode;

  const enableDevRuntime = process.env.LOCAL_MD_DEV_RUNTIME?.toLowerCase() === 'true';
  if (process.env.NODE_ENV !== 'production' && enableDevRuntime) {
    return 'runtime' as const;
  }

  return 'build' as const;
}

export function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}
