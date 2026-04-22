import { localMd } from '@windrun-huaiin/fumadocs-local-md';
import { loader, type MetaData, type PageData, type Source } from 'fumadocs-core/source';
import { rehypeCodeDefaultOptions, remarkNpm, remarkSteps } from 'fumadocs-core/mdx-plugins';
import type { StructuredData } from 'fumadocs-core/mdx-plugins';
import type { TOCItemType } from 'fumadocs-core/toc';
import type { MDXComponents } from 'mdx/types';
import type { Element } from 'hast';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { ShikiTransformerContext as TransformerContext } from 'shiki';
import { createCommonDocsSchema, createCommonMetaSchema, remarkInstallOptions } from '@third-ui/lib/fuma-schema-check-util';
import { i18n } from '@/i18n';
import type { ReactNode } from 'react';
import { getGlobalIcon } from '@base-ui/components/server';

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

const sharedCompilerOptions = {
  mdxOptions: {
    remarkImageOptions: false,
    rehypeCodeOptions: {
      lazy: true,
      inline: 'tailing-curly-colon' as const,
      themes: {
        light: 'catppuccin-latte',
        dark: 'catppuccin-mocha',
      },
      transformers: [
        {
          name: 'transformer:parse-code-language',
          pre(this: TransformerContext | { options?: { lang?: string } }, preNode: Element) {
            const languageFromOptions = this.options?.lang;

            if (languageFromOptions && languageFromOptions.trim() !== '') {
              if (!preNode.properties) {
                preNode.properties = {};
              }

              preNode.properties['data-language'] = languageFromOptions.toLowerCase();
            }

            return preNode;
          },
        },
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        {
          name: 'transformers:remove-notation-escape',
          code(hast: {
            children: Array<{
              type: string;
              children?: Array<{
                type: string;
                value?: string;
                children?: Array<{ type: string; value?: string }>;
              }>;
            }>;
          }) {
            for (const line of hast.children) {
              if (line.type !== 'element' || !line.children) continue;

              let lastSpan:
                | {
                    type: string;
                    value?: string;
                    children?: Array<{ type: string; value?: string }>;
                  }
                | undefined;

              for (let i = line.children.length - 1; i >= 0; i -= 1) {
                const candidate = line.children[i];
                if (candidate.type === 'element') {
                  lastSpan = candidate;
                  break;
                }
              }

              const head = lastSpan?.children?.[0];
              if (head?.type !== 'text' || typeof head.value !== 'string') continue;

              head.value = head.value.replace(/\[\\!code/g, '[!code');
            }
          },
        },
      ],
    },
    remarkPlugins: [
      remarkSteps,
      remarkMath,
      [remarkNpm, remarkInstallOptions] as [typeof remarkNpm, typeof remarkInstallOptions],
    ],
    rehypePlugins: [rehypeKatex],
  },
};

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
