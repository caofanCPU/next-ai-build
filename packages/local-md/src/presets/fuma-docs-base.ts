import type { MarkdownCompilerOptions, MDXProcessorOptions } from '../md/compiler';
import { createStepsFeatureOptions } from '../server/features/steps';

export interface FumaDocsCompilerFeatureOptions {
  mdOptions?: Pick<MDXProcessorOptions, 'remarkPlugins' | 'rehypePlugins'>;
  mdxOptions?: Pick<MDXProcessorOptions, 'remarkPlugins' | 'rehypePlugins'>;
}

export interface CreateFumaDocsBaseCompilerOptions {
  features?: FumaDocsCompilerFeatureOptions[];
}

function mergePlugins(
  features: readonly FumaDocsCompilerFeatureOptions[],
  target: 'mdOptions' | 'mdxOptions',
  pluginType: 'remarkPlugins' | 'rehypePlugins',
) {
  return features.flatMap((feature) => feature[target]?.[pluginType] ?? []);
}

export function createFumaDocsBaseCompilerOptions(
  options: CreateFumaDocsBaseCompilerOptions = {},
): MarkdownCompilerOptions {
  const stepsFeatureOptions = createStepsFeatureOptions();
  const features = options.features ?? [];
  const baseRemarkPlugins = stepsFeatureOptions.remarkPlugins ?? [];

  return {
    mdOptions: {
      remarkPlugins: [
        ...baseRemarkPlugins,
        ...mergePlugins(features, 'mdOptions', 'remarkPlugins'),
      ],
      rehypePlugins: mergePlugins(features, 'mdOptions', 'rehypePlugins'),
    },
    mdxOptions: {
      remarkImageOptions: false,
      remarkPlugins: [
        ...baseRemarkPlugins,
        ...mergePlugins(features, 'mdxOptions', 'remarkPlugins'),
      ],
      rehypePlugins: mergePlugins(features, 'mdxOptions', 'rehypePlugins'),
    },
  };
}
