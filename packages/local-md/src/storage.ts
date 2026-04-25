import fs from 'node:fs/promises';
import { glob } from 'tinyglobby';
import path from 'node:path';
import type { LocalMarkdownConfig } from './core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { PageData } from 'fumadocs-core/source';
import { parseFrontmatter } from './frontmatter';
import * as defaultSchemas from './schema';
import { logLocalMdDebug } from './debug';

export interface RawPage<Frontmatter = Record<string, unknown>> {
  path: string;
  absolutePath: string;

  title: string;
  description?: string;
  icon?: string;
  content: string;
  frontmatter: Frontmatter;
}

export interface RawMeta<Data = Record<string, unknown>> {
  path: string;
  absolutePath: string;
  data: Data;
}

const CHUNK_SIZE = 100;

function isLocalMdCacheDisabled() {
  return process.env.LOCAL_MD_CACHE_DISABLE?.toLowerCase() === 'true';
}

export function createStorage<
  FrontmatterSchema extends StandardSchemaV1 = typeof defaultSchemas.pageSchema,
  MetaSchema extends StandardSchemaV1 = typeof defaultSchemas.metaSchema,
>(config: LocalMarkdownConfig<FrontmatterSchema, MetaSchema>) {
  const shouldCache = !isLocalMdCacheDisabled();
  type $Page = RawPage<StandardSchemaV1.InferOutput<FrontmatterSchema>>;
  type $Meta = RawMeta<StandardSchemaV1.InferOutput<MetaSchema>>;
  const filesCache = new Map<string, $Page | $Meta>();
  const {
    include = ['**/*.{md,mdx,json}'],
    dir,
    frontmatterSchema = defaultSchemas.pageSchema,
    metaSchema = defaultSchemas.metaSchema,
  } = config;

  async function buildFile(file: string): Promise<$Page | $Meta | undefined> {
    const absolutePath = path.resolve(dir, file);
    if (shouldCache) {
      const cached = filesCache.get(absolutePath);
      if (cached) return cached;
    }

    const ext = path.extname(file);

    try {
      let out: $Page | $Meta | undefined;
      switch (ext) {
        case '.json':
          out = await json(absolutePath, file);
          break;
        case '.mdx':
        case '.md':
          out = await md(absolutePath, file);
          break;
      }

      if (shouldCache) {
        if (out === undefined) filesCache.delete(absolutePath);
        else filesCache.set(absolutePath, out);
      }

      return out;
    } catch (e) {
      console.error(`error when parsing ${file}`, e);
      filesCache.delete(absolutePath);
    }
  }

  async function md(absolutePath: string, file: string): Promise<$Page> {
    const content = await fs.readFile(absolutePath, 'utf-8');
    const parsed = parseFrontmatter(content);

    const frontmatterResult = await frontmatterSchema['~standard'].validate(parsed.data);
    if (frontmatterResult.issues) {
      const message = frontmatterResult.issues
        .map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
        .join('\n');
      throw new Error(`invalid frontmatter in "${absolutePath}": ${message}`);
    }

    const frontmatter = frontmatterResult.value as StandardSchemaV1.InferOutput<FrontmatterSchema>;
    const pageData = frontmatter as PageData;
    return {
      path: file,
      absolutePath,
      title: pageData.title ?? path.basename(file, path.extname(file)),
      description: pageData.description,
      icon: pageData.icon,
      content: parsed.content,
      frontmatter,
    };
  }

  async function json(absolutePath: string, file: string): Promise<$Meta | undefined> {
    const content = await fs.readFile(absolutePath, 'utf-8');
    const parsed = JSON.parse(content);
    const result = await metaSchema['~standard'].validate(parsed);
    if (result.issues) {
      const message = result.issues
        .map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
        .join('\n');
      throw new Error(`invalid data in "${absolutePath}": ${message}`);
    }

    return {
      path: file,
      absolutePath,
      data: result.value,
    };
  }

  return {
    invalidateCache(absolutePath: string) {
      filesCache.delete(absolutePath);
    },
    async getPages() {
      const files = await glob(include, {
        cwd: dir,
      });
      logLocalMdDebug('storage:getPages:glob', {
        dir,
        processCwd: process.cwd(),
        include,
        fileCount: files.length,
        sampleFiles: files.slice(0, 10),
      });
      const chunks: Promise<($Page | $Meta | undefined)[]>[] = [];

      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        const promises: Promise<$Page | $Meta | undefined>[] = [];
        const L = Math.min(files.length, i + CHUNK_SIZE);

        for (let j = i; j < L; j++) {
          promises.push(buildFile(files[j]));
        }

        chunks.push(Promise.all(promises));
      }

      const pages: $Page[] = [];
      const metas: $Meta[] = [];
      for await (const chunk of chunks) {
        for (const item of chunk) {
          if (!item) continue;
          if ('frontmatter' in item) pages.push(item);
          else metas.push(item);
        }
      }

      logLocalMdDebug('storage:getPages:parsed', {
        dir,
        processCwd: process.cwd(),
        pageFileCount: pages.length,
        metaFileCount: metas.length,
      });

      return { pages, metas };
    },
  };
}
