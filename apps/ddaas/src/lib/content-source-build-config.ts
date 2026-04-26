import { createFumaDocsBaseCompilerOptions } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/base';
import { createFumaDocsCodeFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/code';
import { createFumaDocsMathFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/math';
import { createFumaDocsNpmFeature } from '@windrun-huaiin/fumadocs-local-md/presets/fuma-docs/features/npm';
import { createCommonDocsSchema, createCommonMetaSchema } from '@windrun-huaiin/third-ui/lib/server';
import { createCommonAppConfig, LOCALE_PRESETS } from '@windrun-huaiin/lib/common-app-config';

export function createLocalMdSourceBuildConfig() {
  const appConfig = createCommonAppConfig(LOCALE_PRESETS.EN_ZH);

  return {
    i18n: {
      defaultLanguage: appConfig.i18n.defaultLocale,
      languages: appConfig.i18n.locales,
      hideLocale: appConfig.i18n.localePrefixAsNeeded ? 'default-locale' : 'never',
    },
    frontmatterSchema: createCommonDocsSchema(),
    metaSchema: createCommonMetaSchema(),
    ...createFumaDocsBaseCompilerOptions({
      features: [
        createFumaDocsCodeFeature(),
        createFumaDocsMathFeature(),
        createFumaDocsNpmFeature(),
      ],
    }),
  };
}
