import { createCommonAppConfig, createI18nHelpers, LOCALE_PRESETS } from "@lib/common-app-config";

// create app config
export const appConfig = {
  ...createCommonAppConfig(LOCALE_PRESETS.EN_ZH),
};

// export i18n helpers
export const { isSupportedLocale, getValidLocale, generatedLocales} = createI18nHelpers(appConfig.i18n);

export const { localePrefixAsNeeded, defaultLocale } = appConfig.i18n;

// export shortcuts
export const { iconColor, watermark, showBanner, clerkPageBanner, clerkAuthInModal, placeHolderImage } = appConfig.shortcuts;
