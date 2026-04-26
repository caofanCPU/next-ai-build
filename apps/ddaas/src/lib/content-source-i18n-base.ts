import type { I18nConfig } from '@windrun-huaiin/fumadocs-local-md/server';
import { appConfig } from './appConfig';

export function createContentSourceI18nConfig(): I18nConfig {
  return {
    defaultLanguage: appConfig.i18n.defaultLocale,
    languages: appConfig.i18n.locales as unknown as string[],
    hideLocale: appConfig.i18n.localePrefixAsNeeded ? 'default-locale' : 'never',
  };
}
