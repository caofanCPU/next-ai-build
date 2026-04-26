import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { MetaData, StaticSource } from 'fumadocs-core/source';
import { localMd } from '../core';
import { getLocalMdDurationMs, getLocalMdNow, logLocalMdDebug } from '../debug';
import type { CreateLocalMdSourceLoaderOptions, LegacyDocData } from './source-shared';
import { countSourceFiles, toRecord } from './source-shared';

export async function createRuntimeSource<
  FrontmatterSchema extends StandardSchemaV1,
  MetaSchema extends StandardSchemaV1,
>(
  sourceKey: string,
  dir: string,
  config: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'sourceKey' | 'dir' | 'baseUrl' | 'sourceRootDir' | 'i18n' | 'icon' | 'mode' | 'appRoot'>,
): Promise<StaticSource<{ pageData: LegacyDocData<Record<string, unknown>>; metaData: MetaData }>> {
  const startedAt = getLocalMdNow();
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
    durationMs: getLocalMdDurationMs(startedAt),
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
