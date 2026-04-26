import { getGlobalIcon, globalLucideIcons } from '@base-ui/components/server';
import { createConfiguredLocalMdSourceFactory } from '@windrun-huaiin/fumadocs-local-md/server/source';
import {
  createFumaDocsBaseCompilerOptions,
} from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';
import { createFumaDocsCodeFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/code';
import { createFumaDocsMathFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/math';
import { createFumaDocsNpmFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/npm';
import {
  createCommonDocsSchema,
  createCommonMetaSchema,
} from '@windrun-huaiin/third-ui/lib/server';
import {
  createSiteMdxComponents,
} from '@windrun-huaiin/third-ui/fuma/server/site-mdx/base';
import { createCodeMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/code';
import { createMathMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/math';
import { createMermaidMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/mermaid';
import { createTypeTableMdxComponents } from '@windrun-huaiin/third-ui/fuma/server/site-mdx/features/type-table';
import type { MDXComponents } from 'mdx/types';
import { appConfig } from '@/lib/appConfig';
import { i18n } from '@/lib/i18n-base';

type SourceKey = 'docs' | 'blog' | 'legal';
type SourceFactory = ReturnType<typeof createConfiguredLocalMdSourceFactory>;

export interface CreateSiteDocsOptions {
  features?: {
    code?: boolean;
    math?: boolean;
    npm?: boolean;
    mermaid?: boolean;
    typeTable?: boolean;
  };
  additionalComponents?: MDXComponents;
}

export function createSiteDocs(options: CreateSiteDocsOptions = {}) {
  const {
    features = {},
    additionalComponents,
  } = options;
  const {
    code = false,
    math = false,
    npm = false,
    mermaid = false,
    typeTable = false,
  } = features;

  const sourceFeatures = [
    ...(code ? [createFumaDocsCodeFeature()] : []),
    ...(math ? [createFumaDocsMathFeature()] : []),
    ...(npm ? [createFumaDocsNpmFeature()] : []),
  ];

  const mdxFeatures = [
    ...(code ? [createCodeMdxComponents()] : []),
    ...(math ? [createMathMdxComponents()] : []),
    ...(mermaid ? [createMermaidMdxComponents(appConfig.style.watermark.enabled, appConfig.style.watermark.text)] : []),
    ...(typeTable ? [createTypeTableMdxComponents()] : []),
  ];

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
      return sourceFactory.getCachedSource(sourceKey, overrides);
    },
  };
}
