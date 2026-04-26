import { appConfig } from '@/lib/appConfig';
import { i18n } from '@/lib/i18n-base';
import { getGlobalIcon } from '@base-ui/components/server';
import { globalLucideIcons } from '@base-ui/icons';
import {
  createConfiguredLocalMdSourceFactory,
} from '@windrun-huaiin/fumadocs-local-md/server/source';
import {
  createFumaDocsBaseCompilerOptions,
  type FumaDocsCompilerFeatureOptions,
} from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';
import {
  createCommonDocsSchema,
  createCommonMetaSchema,
} from '@windrun-huaiin/third-ui/lib/server';
import {
  createSiteMdxComponents,
  type SiteMdxFeatureComponents,
} from '@windrun-huaiin/third-ui/fuma/server/site-mdx/base';
import type { MDXComponents } from 'mdx/types';

type SourceKey = 'docs' | 'blog' | 'legal';
type SourceFactory = ReturnType<typeof createConfiguredLocalMdSourceFactory>;

function resolveLocalMdMode() {
  const enableDevRuntime = process.env.LOCAL_MD_DEV_RUNTIME?.toLowerCase() === 'true';

  if (process.env.NODE_ENV !== 'production' && enableDevRuntime) {
    return 'runtime' as const;
  }

  return 'build' as const;
}

function createSiteDocs(options: {
  sourceFeatures?: FumaDocsCompilerFeatureOptions[];
  mdxFeatures?: SiteMdxFeatureComponents[];
  additionalComponents?: MDXComponents;
} = {}) {
  const {
    sourceFeatures = [],
    mdxFeatures = [],
    additionalComponents,
  } = options;

  const sharedConfig = {
    i18n,
    frontmatterSchema: createCommonDocsSchema(),
    metaSchema: createCommonMetaSchema(),
    appRoot: process.cwd(),
    icon(icon: string | undefined) {
      return getGlobalIcon(icon, true);
    },
  };

  const buildConfig = {
    ...sharedConfig,
    ...createFumaDocsBaseCompilerOptions({
      features: sourceFeatures,
    }),
  };

  const sourceFactory: SourceFactory = createConfiguredLocalMdSourceFactory(sharedConfig);
  const getMDXComponents = createSiteMdxComponents({
    baseOptions: {
      imageFallbackSrc: appConfig.style.placeHolder.image,
      cdnBaseUrl: appConfig.style.cdnBaseUrl,
    },
    features: mdxFeatures,
    additionalComponents: {
      ...globalLucideIcons,
      ...additionalComponents,
    },
  });

  return {
    i18n,
    buildConfig,
    getMDXComponents,
    useMDXComponents: getMDXComponents,
    async getContentSource(
      sourceKey: SourceKey,
      overrides?: Parameters<SourceFactory['getCachedSource']>[1],
    ) {
      return sourceFactory.getCachedSource(sourceKey, {
        mode: resolveLocalMdMode(),
        ...overrides,
      });
    },
  };
}

export const siteDocs = createSiteDocs({
  sourceFeatures: [],
  mdxFeatures: [],
});
