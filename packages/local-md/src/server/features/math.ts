import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import type { MDXProcessorOptions } from '../../md/compiler';

export function createMathFeatureOptions(): Pick<MDXProcessorOptions, 'remarkPlugins' | 'rehypePlugins'> {
  return {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  };
}
