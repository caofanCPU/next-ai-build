import { docsPageSchema, metaSchema } from '../schema';
import { createFumaDocsBaseCompilerOptions } from '../presets/fuma-docs-base';
import { createFumaDocsCodeFeature } from '../presets/fuma-docs-features/code';
import { createFumaDocsMathFeature } from '../presets/fuma-docs-features/math';
import { createFumaDocsNpmFeature } from '../presets/fuma-docs-features/npm';

export function createDefaultLocalMdBuildOptions() {
  return {
    frontmatterSchema: docsPageSchema,
    metaSchema,
    ...createFumaDocsBaseCompilerOptions({
      features: [
        createFumaDocsCodeFeature(),
        createFumaDocsMathFeature(),
        createFumaDocsNpmFeature(),
      ],
    }),
  };
}
