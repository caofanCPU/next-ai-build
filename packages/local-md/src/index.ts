import type { MetaData, PageData, Source, VirtualFile } from 'fumadocs-core/source';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { createStorage } from './storage';
import * as defaultSchemas from './schema';
import { createMarkdownRenderer, MarkdownRendererOptions, PageRenderer } from './md/renderer';
import { createMarkdownCompiler, MarkdownCompilerOptions } from './md/compiler';

export interface LocalMarkdownConfig<
  FrontmatterSchema extends StandardSchemaV1,
  MetaSchema extends StandardSchemaV1,
> extends MarkdownCompilerOptions {
  /**
   * root directory for content files.
   */
  dir: string;
  /**
   * a list of glob patterns, customize the content files to be scanned.
   */
  include?: string[];
  rendererOptions?: MarkdownRendererOptions;

  frontmatterSchema?: FrontmatterSchema;
  metaSchema?: MetaSchema;
}

export interface LocalMarkdown<
  FrontmatterSchema extends StandardSchemaV1,
  MetaSchema extends StandardSchemaV1,
> {
  staticSource: <ModuleExports = Record<string, unknown>>() => Promise<
    Source<{
      pageData: LocalMarkdownPage<StandardSchemaV1.InferOutput<FrontmatterSchema>, ModuleExports>;
      metaData: StandardSchemaV1.InferOutput<MetaSchema> & MetaData;
    }>
  >;
}

export interface LocalMarkdownPage<
  Frontmatter = Record<string, unknown>,
  ModuleExports = Record<string, unknown>,
> extends PageData {
  title: string;
  description?: string;
  icon?: string;
  content: string;
  frontmatter: Frontmatter;

  load: () => Promise<PageRenderer<ModuleExports>>;
}

function isLocalMdCacheDisabled() {
  return process.env.LOCAL_MD_CACHE_DISABLE?.toLowerCase() === 'true';
}

export function localMd<
  FrontmatterSchema extends StandardSchemaV1 = typeof defaultSchemas.pageSchema,
  MetaSchema extends StandardSchemaV1 = typeof defaultSchemas.metaSchema,
>(
  config: LocalMarkdownConfig<FrontmatterSchema, MetaSchema>,
): LocalMarkdown<FrontmatterSchema, MetaSchema> {
  const shouldCache = !isLocalMdCacheDisabled();
  const storage = createStorage(config);
  const compiler = createMarkdownCompiler(config);
  const renderer = createMarkdownRenderer(compiler, config.rendererOptions);
  let cachedStaticSource: Promise<
    Source<{
      pageData: LocalMarkdownPage<StandardSchemaV1.InferOutput<FrontmatterSchema>, never>;
      metaData: StandardSchemaV1.InferOutput<MetaSchema> & MetaData;
    }>
  > | null = null;

  async function createFiles() {
    const { metas, pages } = await storage.getPages();
    const files: VirtualFile<{
      pageData: LocalMarkdownPage<StandardSchemaV1.InferOutput<FrontmatterSchema>, never>;
      metaData: StandardSchemaV1.InferOutput<MetaSchema> & MetaData;
    }>[] = [];

    for (const page of pages) {
      files.push({
        type: 'page',
        path: page.path,
        absolutePath: page.absolutePath,
        data: {
          title: page.title,
          description: page.description,
          icon: page.icon,
          content: page.content,
          frontmatter: page.frontmatter,
          load() {
            return renderer.compile(page);
          },
        },
      });
    }

    for (const meta of metas) {
      files.push({
        type: 'meta',
        path: meta.path,
        absolutePath: meta.absolutePath,
        data: meta.data!,
      });
    }

    return files;
  }

  async function createSource() {
    return { files: await createFiles() };
  }

  return {
    staticSource() {
      if (!shouldCache) {
        return createSource();
      }

      return (cachedStaticSource ??= createSource());
    },
  };
}

export type { RawMeta, RawPage } from './storage';
export type {
  MDXProcessorOptions,
  CompileResult,
  MarkdownCompilerOptions,
  MarkdownCompiler,
  MarkdownProcessorOptions,
} from './md/compiler';
export type { MarkdownRendererOptions, PageRenderer } from './md/renderer';
export {
  createCodeFeatureOptions,
  createMathFeatureOptions,
  createNpmFeatureOptions,
  createStepsFeatureOptions,
} from './server/features';
export type { LocalMdxFeature } from '@windrun-huaiin/contracts/mdx';
export { createFumaDocsCompilerOptions } from './presets/fuma-docs';
export type { CreateFumaDocsCompilerOptions } from './presets/fuma-docs';
