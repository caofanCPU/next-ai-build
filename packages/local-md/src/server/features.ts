import { rehypeCodeDefaultOptions, remarkNpm, remarkSteps } from 'fumadocs-core/mdx-plugins';
import type { Element } from 'hast';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { ShikiTransformerContext as TransformerContext } from 'shiki';
import type { MDXProcessorOptions } from '../md/compiler';
import type { RemarkNpmOptions } from 'fumadocs-core/mdx-plugins/remark-npm';

type CodeLineNode = {
  type: string;
  children?: Array<{
    type: string;
    value?: string;
    children?: Array<{ type: string; value?: string }>;
  }>;
};

export function createCodeFeatureOptions(): Pick<MDXProcessorOptions, 'rehypeCodeOptions'> {
  return {
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
          code(hast: { children: CodeLineNode[] }) {
            for (const line of hast.children) {
              if (line.type !== 'element' || !line.children) continue;

              let lastSpan: CodeLineNode | undefined;

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
  };
}

export function createMathFeatureOptions(): Pick<MDXProcessorOptions, 'remarkPlugins' | 'rehypePlugins'> {
  return {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  };
}

export function createNpmFeatureOptions(
  remarkInstallOptions?: RemarkNpmOptions,
): Pick<MDXProcessorOptions, 'remarkPlugins'> {
  return {
    remarkPlugins: [
      [remarkNpm, remarkInstallOptions] as [typeof remarkNpm, RemarkNpmOptions | undefined],
    ],
  };
}

export function createStepsFeatureOptions(): Pick<MDXProcessorOptions, 'remarkPlugins'> {
  return {
    remarkPlugins: [remarkSteps],
  };
}
