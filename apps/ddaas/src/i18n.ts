import { getRequestConfig } from 'next-intl/server';
import path from 'path';
import { appConfig } from "@/lib/appConfig";
import { loadMergedLocaleMessages, type RuntimeMessageSource } from '@windrun-huaiin/lib/i18n-server';
import type { I18nConfig } from 'fumadocs-core/i18n';
 
export const i18n: I18nConfig = {
  defaultLanguage: appConfig.i18n.defaultLocale,
  languages: appConfig.i18n.locales as unknown as string[],
  hideLocale: appConfig.i18n.localePrefixAsNeeded ? "default-locale" : "never",
}

// Can be imported from a shared config
const locales = appConfig.i18n.locales;
const messagesRoot = path.join(process.cwd(), 'messages');
const runtimeMessageSources: readonly RuntimeMessageSource[] = [
  { type: 'file' },
  { type: 'dir', path: 'biz' },
];

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  // Ensure that the incoming locale is valid
  if ( !locale || !locales.includes(locale as (typeof locales)[number])) {
    locale = appConfig.i18n.defaultLocale;
  }

  return {
    locale,
    messages: await loadMergedLocaleMessages({
      locale,
      messagesRoot,
      sources: runtimeMessageSources,
    })
  };
});
