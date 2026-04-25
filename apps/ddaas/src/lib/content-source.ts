import { createConfiguredLocalMdSourceFactory, createFumaDocsCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/server';
import { toLocalMdxFeatures } from '@windrun-huaiin/contracts/mdx';
import { createCommonDocsSchema, createCommonMetaSchema, remarkInstallOptions } from '@third-ui/lib/server';
import { getGlobalIcon } from '@base-ui/components/server';
import { i18n } from '@/i18n';
import { ddaasMdxCapabilities } from '@/lib/mdx-capabilities';

export const mdxSourceFactory = createConfiguredLocalMdSourceFactory({
  i18n,
  icon(icon) {
    return getGlobalIcon(icon, true);
  },
  frontmatterSchema: createCommonDocsSchema(),
  metaSchema: createCommonMetaSchema(),
  ...createFumaDocsCompilerOptions({
    features: toLocalMdxFeatures(ddaasMdxCapabilities),
    remarkInstallOptions,
  }),
});

export function getContentSource(
  sourceKey: 'docs' | 'blog' | 'legal',
  overrides?: Parameters<typeof mdxSourceFactory.getCachedSource>[1],
) {
  return mdxSourceFactory.getCachedSource(sourceKey, overrides);
}
