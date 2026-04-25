import type { RemarkNpmOptions } from 'fumadocs-core/mdx-plugins/remark-npm';
import type { FumaDocsCompilerFeatureOptions } from '../fuma-docs-base';
import { createNpmFeatureOptions } from '../../server/features/npm';

export function createFumaDocsNpmFeature(
  remarkInstallOptions?: RemarkNpmOptions,
): FumaDocsCompilerFeatureOptions {
  const options = createNpmFeatureOptions(remarkInstallOptions);

  return {
    mdOptions: options,
    mdxOptions: options,
  };
}
