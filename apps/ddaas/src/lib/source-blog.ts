import { appConfig } from '@/lib/appConfig';
import { createCachedLocalMdLoader } from '@/lib/local-md-source';

export const getBlogSource = createCachedLocalMdLoader(appConfig.mdxSourceDir.blog, '/blog');
