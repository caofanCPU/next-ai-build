import { createConfiguredLocalMdSourceFactory } from '@windrun-huaiin/fumadocs-local-md/server/source';
import { createLocalMdSourceSharedConfig } from '@/lib/content-source-shared';

type MdxSourceFactory = ReturnType<typeof createConfiguredLocalMdSourceFactory>;

function resolveLocalMdMode() {
  const enableDevRuntime = process.env.LOCAL_MD_DEV_RUNTIME?.toLowerCase() === 'true';

  if (process.env.NODE_ENV !== 'production' && enableDevRuntime) {
    return 'runtime' as const;
  }

  return 'build' as const;
}

export const mdxSourceFactory: MdxSourceFactory = createConfiguredLocalMdSourceFactory({
  ...createLocalMdSourceSharedConfig(),
});

export async function getContentSource(
  sourceKey: 'docs' | 'blog' | 'legal',
  overrides?: Parameters<MdxSourceFactory['getCachedSource']>[1],
) {
  return mdxSourceFactory.getCachedSource(sourceKey, {
    mode: resolveLocalMdMode(),
    ...overrides,
  });
}
