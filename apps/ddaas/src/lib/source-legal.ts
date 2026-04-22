import { appConfig } from '@/lib/appConfig';
import { createCachedLocalMdLoader } from '@/lib/local-md-source';

export const getLegalSource = createCachedLocalMdLoader(appConfig.mdxSourceDir.legal, '/legal');
