import type { MarkdownCompilerOptions } from '../md/compiler';
import type { RemarkNpmOptions } from 'fumadocs-core/mdx-plugins/remark-npm';
import type { LocalMdxFeature } from '@windrun-huaiin/contracts/mdx';
import {
  createCodeFeatureOptions,
  createMathFeatureOptions,
  createNpmFeatureOptions,
  createStepsFeatureOptions,
} from '../server/features';

export interface CreateFumaDocsCompilerOptions {
  features?: LocalMdxFeature[];
  code?: boolean;
  math?: boolean;
  npm?: boolean;
  steps?: boolean;
  remarkInstallOptions?: RemarkNpmOptions;
}

const DEFAULT_LOCAL_MDX_FEATURES: LocalMdxFeature[] = ['code', 'math', 'npm', 'steps'];

export function createFumaDocsCompilerOptions(
  options: CreateFumaDocsCompilerOptions = {},
): MarkdownCompilerOptions {
  const {
    features,
    code = true,
    math = true,
    npm = true,
    steps = true,
    remarkInstallOptions,
  } = options;
  const enabledFeatures = new Set(
    features ?? [
      ...(code ? ['code' as const] : []),
      ...(math ? ['math' as const] : []),
      ...(npm ? ['npm' as const] : []),
      ...(steps ? ['steps' as const] : []),
    ],
  );
  if (enabledFeatures.size === 0 && !features) {
    for (const feature of DEFAULT_LOCAL_MDX_FEATURES) {
      enabledFeatures.add(feature);
    }
  }

  return {
    mdxOptions: {
      remarkImageOptions: false,
      ...(enabledFeatures.has('code')
        ? createCodeFeatureOptions()
        : { rehypeCodeOptions: false }),
      remarkPlugins: [
        ...(enabledFeatures.has('steps') ? (createStepsFeatureOptions().remarkPlugins ?? []) : []),
        ...(enabledFeatures.has('math') ? (createMathFeatureOptions().remarkPlugins ?? []) : []),
        ...(enabledFeatures.has('npm') ? (createNpmFeatureOptions(remarkInstallOptions).remarkPlugins ?? []) : []),
      ],
      rehypePlugins: [
        ...(enabledFeatures.has('math') ? (createMathFeatureOptions().rehypePlugins ?? []) : []),
      ],
    },
  };
}
