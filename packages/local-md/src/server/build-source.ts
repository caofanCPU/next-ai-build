import fs from 'node:fs/promises';
import path from 'node:path';
import type { MetaData, StaticSource } from 'fumadocs-core/source';
import { createPageRendererFromCompiled } from '../md/render-shared';
import { getLocalMdDurationMs, getLocalMdNow, logLocalMdDebug } from '../debug';
import type { CreateLocalMdSourceLoaderOptions, LegacyDocData } from './source-shared';
import { countSourceFiles } from './source-shared';
import type { BuiltSourceModuleArtifact } from '../md-build/types';

export async function createBuiltSource(
  sourceKey: string,
  appRoot: string | undefined,
  _config: Omit<CreateLocalMdSourceLoaderOptions, 'sourceKey' | 'dir' | 'baseUrl' | 'sourceRootDir' | 'i18n' | 'icon' | 'mode' | 'buildOutputDir'>,
): Promise<StaticSource<{ pageData: LegacyDocData<Record<string, unknown>>; metaData: MetaData }>> {
  const startedAt = getLocalMdNow();
  const resolvedAppRoot = appRoot ?? process.cwd();
  const sourceModulePath = path.join(resolvedAppRoot, '.source', `${sourceKey}.source.config.mjs`);
  const artifact = await readBuiltSourceArtifact(sourceModulePath);

  if (!artifact || artifact.sourceKey !== sourceKey) {
    throw new Error(`invalid built source module for "${sourceKey}" at ${sourceModulePath}`);
  }

  const files = await Promise.all([
    ...artifact.pages.map(async (page) => {
      let rendererPromise:
        | Promise<ReturnType<typeof createPageRendererFromCompiled<Record<string, unknown>>>>
        | undefined;

      const data: LegacyDocData<Record<string, unknown>> = {
        ...page.frontmatter,
        title: page.title,
        description: page.description,
        icon: page.icon,
        toc: page.toc,
        structuredData: page.structuredData,
        body: async ({ components }) => {
          const rendered = await data.load(components);
          return rendered.body;
        },
        load: async (components) => {
          rendererPromise ??= Promise.resolve(
            createPageRendererFromCompiled<Record<string, unknown>>(
              page.absolutePath,
              page.compiled,
            ),
          );
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
        type: 'page' as const,
        path: page.path,
        absolutePath: page.absolutePath,
        data,
      };
    }),
    ...artifact.metas.map(async (meta) => ({
      type: 'meta' as const,
      path: meta.path,
      absolutePath: meta.absolutePath,
      data: meta.data,
    })),
  ]);

  const source = { files };
  logLocalMdDebug('createBuiltSource:loaded', {
    sourceKey,
    sourceModulePath,
    processCwd: process.cwd(),
    ...countSourceFiles(source),
    durationMs: getLocalMdDurationMs(startedAt),
  });

  return source;
}

async function readBuiltSourceArtifact(sourceModulePath: string): Promise<BuiltSourceModuleArtifact> {
  const content = await fs.readFile(sourceModulePath, 'utf8');
  const start = content.indexOf('const source =');
  const exportIndex = content.lastIndexOf('export default source;');

  if (start === -1 || exportIndex === -1) {
    throw new Error(`invalid local-md source module format: ${sourceModulePath}`);
  }

  const jsonLike = content
    .slice(start + 'const source ='.length, exportIndex)
    .trim()
    .replace(/;$/, '')
    .trim();

  return JSON.parse(jsonLike) as BuiltSourceModuleArtifact;
}
