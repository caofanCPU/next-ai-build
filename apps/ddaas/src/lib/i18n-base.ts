import type { I18nConfig } from '@local-md/server';
import { appConfig } from '@/lib/appConfig';

export const i18n: I18nConfig = {
  defaultLanguage: appConfig.i18n.defaultLocale,
  languages: appConfig.i18n.locales as string[],
  hideLocale: appConfig.i18n.localePrefixAsNeeded ? 'default-locale' : 'never',
};
