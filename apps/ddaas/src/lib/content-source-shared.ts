import { createCommonDocsSchema, createCommonMetaSchema } from '@third-ui/lib/server';
import { getGlobalIcon } from '@base-ui/components/server';
import { createContentSourceI18nConfig } from './content-source-i18n-base';

export function createLocalMdSourceSharedConfig() {
  return {
    i18n: createContentSourceI18nConfig(),
    icon(icon: string | undefined) {
      return getGlobalIcon(icon, true);
    },
    frontmatterSchema: createCommonDocsSchema(),
    metaSchema: createCommonMetaSchema(),
    appRoot: process.cwd(),
  };
}
