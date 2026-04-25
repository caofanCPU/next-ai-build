import { remarkSteps } from 'fumadocs-core/mdx-plugins/remark-steps';
import type { MDXProcessorOptions } from '../../md/compiler';

export function createStepsFeatureOptions(): Pick<MDXProcessorOptions, 'remarkPlugins'> {
  return {
    remarkPlugins: [remarkSteps],
  };
}
