// Supported languages and their labels
const ALL_LOCALE_LABELS = {
  en: "English",
  zh: "简体中文",
  ja: "日本語", 
  ko: "한국어",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  tr: "Türkçe",
  pl: "Polski",
  ru: "Русский",
  ar: "العربية",
  hi: "हिन्दी",
  th: "ไทย",
  vi: "Tiếng Việt",
} as const;

export type SupportedLocale = keyof typeof ALL_LOCALE_LABELS;
export type AppThemeMode =
  | 'light-dark-system'
  | 'light-only'
  | 'dark-only';

const APP_THEME_MODES = [
  'light-dark-system',
  'light-only',
  'dark-only',
] as const satisfies readonly AppThemeMode[];

function getAppThemeMode(value: string | undefined): AppThemeMode {
  if (APP_THEME_MODES.includes(value as AppThemeMode)) {
    return value as AppThemeMode;
  }

  if (value) {
    console.warn(
      `[CommonAppConfig] Invalid NEXT_PUBLIC_STYLE_THEME_MODE: ${value}. Fallback to light-dark-system.`,
    );
  }

  return 'light-dark-system';
}

// Helper function to get language configuration from environment variables
function getLocaleLabels(locales: string[]) {
  return Object.fromEntries(
    locales.map(locale => [
      locale, 
      ALL_LOCALE_LABELS[locale as SupportedLocale] || locale
    ])
  );
}

// Common application configuration creation function
export function createCommonAppConfig(options?: {
  // Optional: manually specify supported languages, otherwise read from environment variables
  locales?: string[];
  defaultLocale?: string;
}) {
  // Priority: manual configuration > environment variables > default values
  const locales = options?.locales ?? 
                  process.env.NEXT_PUBLIC_I18N_LOCALES?.split(',').map(s => s.trim()) ?? 
                  ['en', 'zh'];
  
  const defaultLocale = options?.defaultLocale ?? 
                        process.env.NEXT_PUBLIC_I18N_DEFAULT_LOCALE ?? 
                        'en';
  
  const storagePrefix = process.env.NEXT_PUBLIC_I18N_STORAGE_PREFIX || 'WINDRUN-HUAIIN';

  const config = {
    // Basic configuration
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
    githubBaseUrl: process.env.NEXT_PUBLIC_GITHUB_BASE_URL || '',
    github: process.env.NEXT_PUBLIC_GITHUB || '',
    githubInfoToken: process.env.NEXT_PUBLIC_FUMA_GITHUB_TOKEN || '',

    // Internationalization configuration
    i18n: {
      locales: locales as readonly string[],
      defaultLocale,
      localePrefixAsNeeded: process.env.NEXT_PUBLIC_I18N_LOCALE_PREFIX_AS_NEEDED !== 'false',
      localeLabels: getLocaleLabels(locales),
      detector: {
        storageKey: process.env.NEXT_PUBLIC_I18N_STORAGE_KEY || 'language-preference-status',
        autoCloseTimeout: parseInt(process.env.NEXT_PUBLIC_I18N_AUTO_CLOSE_TIMEOUT || '10000'),
        expirationDays: parseInt(process.env.NEXT_PUBLIC_I18N_EXPIRATION_DAYS || '30'),
        storagePrefix
      },
      messageRoot: process.env.NEXT_PUBLIC_I18N_MESSAGE_ROOT || 'messages',
    },

    // Style configuration
    style: {
      icon: {
        uniformColor: process.env.NEXT_PUBLIC_STYLE_ICON_COLOR || "purple"
      },
      theme: {
        mode: getAppThemeMode(process.env.NEXT_PUBLIC_STYLE_THEME_MODE),
      },
      showBanner: process.env.NEXT_PUBLIC_STYLE_SHOW_BANNER === 'true',
      clerkAuthInModal: process.env.NEXT_PUBLIC_STYLE_CLERK_AUTH_IN_MODAL === 'true',
      clerkPageBanner: process.env.NEXT_PUBLIC_STYLE_CLERK_PAGE_BANNER === 'true',
      watermark: {
        enabled: process.env.NEXT_PUBLIC_STYLE_WATERMARK_ENABLED === 'true',
        text: process.env.NEXT_PUBLIC_STYLE_WATERMARK_TEXT || "WindRun・Huaiin"
      },
      cdnBaseUrl: process.env.NEXT_PUBLIC_STYLE_CDN_BASE_URL || "",
      cdnProxyUrl: process.env.NEXT_PUBLIC_STYLE_CDN_PROXY_URL || "",
      placeHolder: {
        image: process.env.NEXT_PUBLIC_STYLE_PLACEHOLDER_IMAGE || "/default.webp"
      }
    },

    // Clerk configuration
    clerk: {
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
      fallbackSignInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || "/",
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up", 
      fallbackSignUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || "/",
      waitlistUrl: process.env.NEXT_PUBLIC_CLERK_WAITLIST_URL || "/waitlist",
      debug: process.env.CLERK_DEBUG === 'true',
    },

  };

  // Convenient constants - avoid deep nested access
  const shortcuts = {
    iconColor: config.style.icon.uniformColor,
    themeMode: config.style.theme.mode,
    watermark: config.style.watermark,
    showBanner: config.style.showBanner,
    clerkPageBanner: config.style.clerkPageBanner,
    clerkAuthInModal: config.style.clerkAuthInModal,
    placeHolderImage: config.style.placeHolder.image,
    clerk: config.clerk,
  };

  return {
    ...config,
    shortcuts
  };
}

// Create internationalization helper functions
export function createI18nHelpers(i18nConfig: ReturnType<typeof createCommonAppConfig>['i18n']) {
  function isSupportedLocale(locale: string): locale is typeof i18nConfig.locales[number] {
    return (i18nConfig.locales as readonly string[]).includes(locale);
  }

  function getValidLocale(locale: string): typeof i18nConfig.locales[number] {
    return isSupportedLocale(locale) ? locale : i18nConfig.defaultLocale;
  }

  const generatedLocales = i18nConfig.locales.map((loc) => ({
    name: i18nConfig.localeLabels[loc as keyof typeof i18nConfig.localeLabels] || loc,
    locale: loc,
  }));

  return {
    isSupportedLocale,
    getValidLocale,
    generatedLocales
  };
}

// Convenient configuration presets
export const LOCALE_PRESETS = {
  // Only support English
  EN_ONLY: { locales: ['en'] as string[], defaultLocale: 'en' as string },
  
  // English and Chinese
  EN_ZH: { locales: ['en', 'zh'] as string[], defaultLocale: 'en' as string },
  
  // Main Asian languages
  ASIA: { locales: ['en', 'zh', 'ja', 'ko'] as string[], defaultLocale: 'en' as string },
  
  // Main European languages
  EUROPE: { locales: ['en', 'fr', 'de', 'es', 'it'] as string[], defaultLocale: 'en' as string },
  
  // Globalization
  GLOBAL: { locales: ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'pt', 'ru'] as string[], defaultLocale: 'en' as string },
  
  // No internationalization (only default language)
  NONE: { locales: [] as string[], defaultLocale: 'en' as string }
}; 
