import { createFumaDocsCompilerOptions, localMd } from '@windrun-huaiin/fumadocs-local-md';
import { toLocalMdxFeatures } from '@windrun-huaiin/contracts/mdx';
import { loader, type MetaData, type PageData, type Source } from 'fumadocs-core/source';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { TOCItemType } from 'fumadocs-core/toc';
import type { MDXComponents } from 'mdx/types';
import { createCommonDocsSchema, createCommonMetaSchema, remarkInstallOptions } from '@third-ui/lib/fuma-schema-check-util';
import { i18n } from '@/i18n';
import type { ReactNode } from 'react';
import { getGlobalIcon } from '@base-ui/components/server';
import { ddaasMdxCapabilities } from '@/lib/mdx-capabilities';

type BodyComponent = (props: { components?: MDXComponents }) => Promise<ReactNode>;
type RenderResult = {
  body: ReactNode;
  toc: TOCItemType[];
  structuredData: StructuredData;
  exports: Record<string, unknown>;
};

type LegacyDocData<Frontmatter> = Frontmatter &
  PageData & {
    body: BodyComponent;
    load: (components?: MDXComponents) => Promise<RenderResult>;
  };

function isLocalMdCacheDisabled() {
  return process.env.LOCAL_MD_CACHE_DISABLE?.toLowerCase() === 'true';
}

const sharedCompilerOptions = createFumaDocsCompilerOptions({
  features: toLocalMdxFeatures(ddaasMdxCapabilities),
  remarkInstallOptions,
});

async function createRuntimeSource(dir: string): Promise<Source<{ pageData: LegacyDocData<Record<string, unknown>>; metaData: MetaData }>> {
  const instance = localMd({
    dir,
    frontmatterSchema: createCommonDocsSchema(),
    metaSchema: createCommonMetaSchema(),
    ...sharedCompilerOptions,
  });

  const source = await instance.staticSource();
  type SourceFile = (typeof source.files)[number];
  const files = await Promise.all(
    source.files.map(async (file: SourceFile) => {
      if (file.type === 'meta') {
        return file;
      }

      const page = file.data;
      const rendererPromise = page.load();

      const data: LegacyDocData<Record<string, unknown>> = {
        ...page.frontmatter,
        title: page.title,
        description: page.description,
        icon: page.icon,
        body: async ({ components }) => {
          const rendered = await data.load(components);
          return rendered.body;
        },
        load: async (components) => {
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

export async function createLocalMdLoader(dir: string, baseUrl: string) {
  const source = await createRuntimeSource(dir);
  return loader({
    i18n,
    baseUrl,
    source,
    icon(icon) {
      return getGlobalIcon(icon, true);
    },
  });
}

export function createCachedLocalMdLoader(dir: string, baseUrl: string) {
  let cached: Promise<ReturnType<typeof loader>> | undefined;

  return function getLocalMdLoader() {
    if (isLocalMdCacheDisabled()) {
      return createLocalMdLoader(dir, baseUrl);
    }

    cached ??= createLocalMdLoader(dir, baseUrl);
    return cached;
  };
}
