import type { FumaDocsCompilerFeatureOptions } from '../fuma-docs-base';
import { createMathFeatureOptions } from '../../server/features/math';

export function createFumaDocsMathFeature(): FumaDocsCompilerFeatureOptions {
  const options = createMathFeatureOptions();

  return {
    mdOptions: options,
    mdxOptions: options,
  };
}
