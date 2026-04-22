import { appConfig } from '@/lib/appConfig';
import { createCachedLocalMdLoader } from '@/lib/local-md-source';

export const getDocsSource = createCachedLocalMdLoader(appConfig.mdxSourceDir.docs, '/docs');
