import { remarkNpm } from 'fumadocs-core/mdx-plugins/remark-npm';
import type { MDXProcessorOptions } from '../../md/compiler';
import type { RemarkNpmOptions } from 'fumadocs-core/mdx-plugins/remark-npm';

export function createNpmFeatureOptions(
  remarkInstallOptions?: RemarkNpmOptions,
): Pick<MDXProcessorOptions, 'remarkPlugins'> {
  return {
    remarkPlugins: remarkInstallOptions
      ? [[remarkNpm, remarkInstallOptions] as [typeof remarkNpm, RemarkNpmOptions]]
      : [remarkNpm],
  };
}
