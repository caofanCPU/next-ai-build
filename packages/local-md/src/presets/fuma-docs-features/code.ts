import type { FumaDocsCompilerFeatureOptions } from '../fuma-docs-base';
import { createCodeFeatureOptions } from '../../server/features/code';

export function createFumaDocsCodeFeature(): FumaDocsCompilerFeatureOptions {
  const options = createCodeFeatureOptions();

  return {
    mdOptions: options,
    mdxOptions: options,
  };
}
