import type { TOCItemType } from 'fumadocs-core/toc';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { ReactNode } from 'react';
import type { RawPage } from '../storage';
import * as JsxRuntime from 'react/jsx-runtime';
import { type Evaluater, toJsxRuntime } from 'hast-util-to-jsx-runtime';
import type { Root } from 'hast';
import type { JSExecutor, JSExecutorConfig } from '../js/executor';
import type { CompileResult, MarkdownCompiler } from './compiler';
import { pathToFileURL } from 'node:url';
import type { MDXComponents, MDXContent } from 'mdx/types';

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
  const {
    executor: getExecutor = async (config) => {
      const { executorVirtual } = await import('../js/executor-virtual');
      return executorVirtual(config);
    },
  } = options;
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

      return {
        get structuredData() {
          return (
            compiled.file.data.structuredData ?? {
              headings: [],
              contents: [],
            }
          );
        },
        async render(components, userContext) {
          if (compiled.type === 'ast') {
            const context = { ...components, ...userContext };
            const executor = await getExecutor({
              jsx: JsxRuntime,
              filePath: page.absolutePath,
            });
            const evaluater = toEvaluater(executor, context);

            function render(tree: Root): ReactNode {
              return toJsxRuntime(tree, {
                filePath: page.absolutePath,
                components,
                development: false,
                createEvaluater() {
                  return evaluater;
                },
                ...JsxRuntime,
              });
            }

            const toc =
              (compiled.file.data.rehypeToc as { title: Root['children'][number]; url: string; depth: number }[] | undefined)?.map(
                (item): TOCItemType => ({
                  ...item,
                  title: render({
                    type: 'root',
                    children: 'children' in item.title ? item.title.children : [item.title],
                  }),
                }),
              ) ?? [];

            return {
              toc,
              body: render(compiled.tree),
              exports: executor.getExports() as M,
            };
          }

          const _out = await executeMdx(
            compiled.code,
            pathToFileURL(page.absolutePath).href,
            userContext,
          );
          const out = _out as {
            toc?: TOCItemType[];
            default: MDXContent;
          };

          return {
            toc: out.toc ?? [],
            body: JsxRuntime.jsx(out.default, {
              components: withMissingMdxComponentFallback(components, compiled.code),
            }),
            exports: out as M,
          };
        },
      };
    },
  };
}

function getMissingMdxComponentNames(code: string) {
  const names = new Set<string>();
  const pattern = /_missingMdxReference\((["'])([^"']+)\1,\s*true/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) != null) {
    const name = match[2];

    if (/^[A-Z][\w$]*$/.test(name)) {
      names.add(name);
    }
  }

  return names;
}

function createMissingMdxComponent(component: string) {
  return function MissingMdxComponent(props: Record<string, unknown>) {
    const {
      children,
      className,
      ...restProps
    } = props;
    const displayProps = Object.entries(restProps)
      .filter(([, value]) =>
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean',
      )
      .map(([key, value]) => [key, String(value)] as const);

    return JsxRuntime.jsxs('div', {
      className: [
        'my-4 rounded-xl border border-red-300 bg-red-50/80 p-4 text-sm text-red-950 shadow-sm dark:border-red-800/80 dark:bg-red-950/30 dark:text-red-100',
        typeof className === 'string' ? className : undefined,
      ].filter(Boolean).join(' '),
      children: [
        JsxRuntime.jsxs('div', {
          className: 'mb-2 flex flex-wrap items-center gap-2 font-medium',
          children: [
            JsxRuntime.jsx('span', { children: 'MDX component not registered' }),
            JsxRuntime.jsx('code', {
              className: 'rounded bg-red-100 px-1.5 py-0.5 text-xs dark:bg-red-900/60',
              children: component,
            }),
          ],
        }),
        displayProps.length > 0
          ? JsxRuntime.jsx('div', {
            className: 'mb-2 flex flex-wrap gap-1.5 text-xs',
            children: displayProps.map(([key, value]) =>
              JsxRuntime.jsxs('span', {
                className: 'rounded-md border border-red-200 bg-white/60 px-1.5 py-0.5 font-mono dark:border-red-900/70 dark:bg-black/20',
                children: [key, '=', value],
              }, key),
            ),
          })
          : null,
        JsxRuntime.jsx('div', {
          className: 'whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-white/70 p-3 font-mono text-xs text-red-900 dark:border-red-900/70 dark:bg-black/20 dark:text-red-100',
          children: children == null || children === ''
            ? JsxRuntime.jsx('span', {
              className: 'italic text-fd-muted-foreground',
              children: 'No fallback content.',
            })
            : children,
        }),
      ],
    });
  };
}

function withMissingMdxComponentFallback(
  components: MDXComponents | undefined,
  code: string,
): MDXComponents {
  const nextComponents: MDXComponents = { ...(components ?? {}) };

  for (const name of getMissingMdxComponentNames(code)) {
    if (nextComponents[name] == null) {
      nextComponents[name] = createMissingMdxComponent(name);
    }
  }

  return nextComponents;
}

const AsyncFunction: new (...args: string[]) => (...args: unknown[]) => Promise<unknown> =
  Object.getPrototypeOf(executeMdx).constructor;

/**
 * Note: unsafe by design
 */
async function executeMdx(compiled: string, baseUrl: string, scope?: object) {
  const fullScope = {
    ...scope,
    opts: {
      ...JsxRuntime,
      baseUrl,
    },
  };

  const hydrateFn = new AsyncFunction(...Object.keys(fullScope), compiled);
  return await hydrateFn.apply(hydrateFn, Object.values(fullScope));
}

function toEvaluater(executor: JSExecutor, context: Record<string, unknown>): Evaluater {
  return {
    evaluateProgram(program) {
      return executor.program(program, context);
    },
    evaluateExpression(node) {
      return executor.expression(node, context);
    },
  };
}
