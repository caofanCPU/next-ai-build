import { createConfiguredLocalMdSourceFactory } from '@windrun-huaiin/fumadocs-local-md/server/source';
import { createFumaDocsBaseCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';
import { createFumaDocsCodeFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/code';
import { createFumaDocsMathFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/math';
import { createFumaDocsNpmFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/npm';
import { createCommonDocsSchema, createCommonMetaSchema } from '@third-ui/lib/server';
import { getGlobalIcon } from '@base-ui/components/server';
import { i18n } from '@/i18n';

type MdxSourceFactory = ReturnType<typeof createConfiguredLocalMdSourceFactory>;

export const mdxSourceFactory: MdxSourceFactory = createConfiguredLocalMdSourceFactory({
  i18n,
  icon(icon) {
    return getGlobalIcon(icon, true);
  },
  frontmatterSchema: createCommonDocsSchema(),
  metaSchema: createCommonMetaSchema(),
  ...createFumaDocsBaseCompilerOptions({
    features: [
      // code
      createFumaDocsCodeFeature(),

      // math
      createFumaDocsMathFeature(),

      // npm
      createFumaDocsNpmFeature(),

      // mermaid, no need source handler, just need components for render

      // type-table, no need source handler, just need components for render
    ],
  }),
});

export async function getContentSource(
  sourceKey: 'docs' | 'blog' | 'legal',
  overrides?: Parameters<MdxSourceFactory['getCachedSource']>[1],
) {
  return mdxSourceFactory.getCachedSource(sourceKey, overrides);
}
