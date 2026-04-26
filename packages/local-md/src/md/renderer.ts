import type { TOCItemType } from 'fumadocs-core/toc';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { ReactNode } from 'react';
import type { RawPage } from '../storage';
import type { JSExecutor, JSExecutorConfig } from '../js/executor';
import type { CompileResult, MarkdownCompiler } from './compiler';
import type { MDXComponents, MDXContent } from 'mdx/types';
import { createPageRendererFromCompiled, serializeCompileResult } from './render-shared';

export interface PageRenderer<ModuleExports = Record<string, unknown>> {
  structuredData: StructuredData;
  render: (
    components?: MDXComponents,
    context?: Record<string, unknown>,
  ) => Promise<{
    exports: ModuleExports;
    toc: TOCItemType[];
    body: ReactNode;
  }>;
}

export interface MarkdownRendererOptions {
  /**
   * the engine to execute JavaScript in Markdown, **not used for MDX files, MDX will always use native JS engine.**
   *
   * by default, it uses a virtual JS engine with limited features.
   */
  executor?: (ctx: JSExecutorConfig) => JSExecutor | Promise<JSExecutor>;
}

export function createMarkdownRenderer(
  compiler: MarkdownCompiler,
  options: MarkdownRendererOptions = {},
) {
  const cache = new WeakMap<RawPage<unknown>, Promise<CompileResult>>();

  return {
    async compile<V, M = Record<string, unknown>>(page: RawPage<V>): Promise<PageRenderer<M>> {
      let promise = cache.get(page);
      if (!promise) {
        promise = compiler.compile({
          path: page.absolutePath,
          value: page.content,
          data: { frontmatter: page.frontmatter },
        });
        cache.set(page, promise);
      }

      const compiled = await promise;
      return createPageRendererFromCompiled<M>(
        page.absolutePath,
        serializeCompileResult(compiled),
        options,
      );
    },
  };
}
