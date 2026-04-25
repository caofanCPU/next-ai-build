import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins/rehype-code';
import { rehypeCode } from 'fumadocs-core/mdx-plugins/rehype-code';
import type { Element } from 'hast';
import type { ShikiTransformerContext as TransformerContext } from 'shiki';
import type { MDXProcessorOptions } from '../../md/compiler';
import { plugin } from '../../md/utils';

type CodeLineNode = {
  type: string;
  children?: Array<{
    type: string;
    value?: string;
    children?: Array<{ type: string; value?: string }>;
  }>;
};

export function createCodeFeatureOptions(): Pick<MDXProcessorOptions, 'rehypePlugins'> {
  return {
    rehypePlugins: [
      plugin(rehypeCode, {
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
      }),
    ],
  };
}
