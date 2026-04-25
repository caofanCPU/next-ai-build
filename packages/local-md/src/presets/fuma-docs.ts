import type { MarkdownCompilerOptions } from '../md/compiler';
import type { RemarkNpmOptions } from 'fumadocs-core/mdx-plugins/remark-npm';

export type LocalMdxFeature = 'code' | 'math' | 'npm';

export interface CreateFumaDocsCompilerOptions {
  features?: LocalMdxFeature[];
  code?: boolean;
  math?: boolean;
  npm?: boolean;
  remarkInstallOptions?: RemarkNpmOptions;
}

const DEFAULT_LOCAL_MDX_FEATURES: LocalMdxFeature[] = ['code', 'math', 'npm'];

export async function createFumaDocsCompilerOptions(
  options: CreateFumaDocsCompilerOptions = {},
): Promise<MarkdownCompilerOptions> {
  const {
    features,
    code = true,
    math = true,
    npm = true,
    remarkInstallOptions,
  } = options;
  const enabledFeatures = new Set(
    features ?? [
      ...(code ? ['code' as const] : []),
      ...(math ? ['math' as const] : []),
      ...(npm ? ['npm' as const] : []),
    ],
  );
  if (enabledFeatures.size === 0 && !features) {
    for (const feature of DEFAULT_LOCAL_MDX_FEATURES) {
      enabledFeatures.add(feature);
    }
  }

  const { createStepsFeatureOptions } = await import('../server/features/steps');
  const codeFeatureOptions = enabledFeatures.has('code')
    ? (await import('../server/features/code')).createCodeFeatureOptions()
    : {};
  const mathFeatureOptions = enabledFeatures.has('math')
    ? (await import('../server/features/math')).createMathFeatureOptions()
    : {};
  const npmFeatureOptions = enabledFeatures.has('npm')
    ? (await import('../server/features/npm')).createNpmFeatureOptions(remarkInstallOptions)
    : {};

  return {
    mdOptions: {
      remarkPlugins: [
        ...(createStepsFeatureOptions().remarkPlugins ?? []),
        ...(mathFeatureOptions.remarkPlugins ?? []),
        ...(npmFeatureOptions.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        ...(codeFeatureOptions.rehypePlugins ?? []),
        ...(mathFeatureOptions.rehypePlugins ?? []),
      ],
    },
    mdxOptions: {
      remarkImageOptions: false,
      remarkPlugins: [
        ...(createStepsFeatureOptions().remarkPlugins ?? []),
        ...(mathFeatureOptions.remarkPlugins ?? []),
        ...(npmFeatureOptions.remarkPlugins ?? []),
      ],
      rehypePlugins: [
        ...(codeFeatureOptions.rehypePlugins ?? []),
        ...(mathFeatureOptions.rehypePlugins ?? []),
      ],
    },
  };
}
