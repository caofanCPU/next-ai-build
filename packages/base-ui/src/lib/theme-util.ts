/**
 * Theme style utility (TypeScript)
 * Maintainer: xxx
 * Note:
 * 1. Static color classes for Tailwind CSS 4.x scanning
 * 2. Single config: NEXT_PUBLIC_STYLE_ICON_COLOR (simple theme name only)
 * 3. Premium/elegant color system (uppercase hex values)
 */

const THEME_COLOR_META_MAP = Object.freeze({
  purple: {
    label: "典雅紫·清",
    textColor: "text-purple-500",
    bgColor: "bg-purple-500/20",
    viaColor: "via-purple-500/20",
    ringColor: "ring-purple-500/20",
    borderColor: "border-purple-500",
    hex: "#AC62FD",
  },
  orange: {
    label: "轻奢橙·暖",
    textColor: "text-orange-500",
    bgColor: "bg-orange-500/20",
    viaColor: "via-orange-500/20",
    ringColor: "ring-orange-500/20",
    borderColor: "border-orange-500",
    hex: "#F97316",
  },
  indigo: {
    label: "沉稳蓝·冷",
    textColor: "text-indigo-500",
    bgColor: "bg-indigo-500/20",
    viaColor: "via-indigo-500/20",
    ringColor: "ring-indigo-500/20",
    borderColor: "border-indigo-500",
    hex: "#6366F1",
  },
  emerald: {
    label: "温润绿·愈",
    textColor: "text-emerald-500",
    bgColor: "bg-emerald-500/20",
    viaColor: "via-emerald-500/20",
    ringColor: "ring-emerald-500/20",
    borderColor: "border-emerald-500",
    hex: "#10B981",
  },
  rose: {
    label: "玫瑰红·柔",
    textColor: "text-rose-500",
    bgColor: "bg-rose-500/20",
    viaColor: "via-rose-500/20",
    ringColor: "ring-rose-500/20",
    borderColor: "border-rose-500",
    hex: "#F43F5E",
  },
} as const);

export type SupportedThemeName = keyof typeof THEME_COLOR_META_MAP;
export type SupportedThemeColor = (typeof THEME_COLOR_META_MAP)[SupportedThemeName]["textColor"];
export type SupportedThemeBgColor = (typeof THEME_COLOR_META_MAP)[SupportedThemeName]["bgColor"];
export type SupportedThemeViaColor = (typeof THEME_COLOR_META_MAP)[SupportedThemeName]["viaColor"];
export type SupportedThemeRingColor = (typeof THEME_COLOR_META_MAP)[SupportedThemeName]["ringColor"];
export type SupportedThemeBorderColor = (typeof THEME_COLOR_META_MAP)[SupportedThemeName]["borderColor"];

// Supported theme color classes (static for Tailwind scan)
export const __SUPPORTED_THEME_COLORS = Object.freeze({
  "text-purple-500": THEME_COLOR_META_MAP.purple.label,
  "text-orange-500": THEME_COLOR_META_MAP.orange.label,
  "text-indigo-500": THEME_COLOR_META_MAP.indigo.label,
  "text-emerald-500": THEME_COLOR_META_MAP.emerald.label,
  "text-rose-500": THEME_COLOR_META_MAP.rose.label,
} as const);

// Hex color map (uppercase, match Tailwind classes)
export const THEME_COLOR_HEX_MAP = Object.freeze({
  "text-purple-500": THEME_COLOR_META_MAP.purple.hex,
  "text-orange-500": THEME_COLOR_META_MAP.orange.hex,
  "text-indigo-500": THEME_COLOR_META_MAP.indigo.hex,
  "text-emerald-500": THEME_COLOR_META_MAP.emerald.hex,
  "text-rose-500": THEME_COLOR_META_MAP.rose.hex,
} as const);

// Short theme names for env configuration
export const THEME_COLOR_NAME_TO_CLASS_MAP = Object.freeze({
  purple: THEME_COLOR_META_MAP.purple.textColor,
  orange: THEME_COLOR_META_MAP.orange.textColor,
  indigo: THEME_COLOR_META_MAP.indigo.textColor,
  emerald: THEME_COLOR_META_MAP.emerald.textColor,
  rose: THEME_COLOR_META_MAP.rose.textColor,
} as const);

export const THEME_COLOR_NAME_TO_BG_CLASS_MAP = Object.freeze({
  purple: THEME_COLOR_META_MAP.purple.bgColor,
  orange: THEME_COLOR_META_MAP.orange.bgColor,
  indigo: THEME_COLOR_META_MAP.indigo.bgColor,
  emerald: THEME_COLOR_META_MAP.emerald.bgColor,
  rose: THEME_COLOR_META_MAP.rose.bgColor,
} as const);

export const THEME_COLOR_NAME_TO_VIA_CLASS_MAP = Object.freeze({
  purple: THEME_COLOR_META_MAP.purple.viaColor,
  orange: THEME_COLOR_META_MAP.orange.viaColor,
  indigo: THEME_COLOR_META_MAP.indigo.viaColor,
  emerald: THEME_COLOR_META_MAP.emerald.viaColor,
  rose: THEME_COLOR_META_MAP.rose.viaColor,
} as const);

export const THEME_COLOR_NAME_TO_RING_CLASS_MAP = Object.freeze({
  purple: THEME_COLOR_META_MAP.purple.ringColor,
  orange: THEME_COLOR_META_MAP.orange.ringColor,
  indigo: THEME_COLOR_META_MAP.indigo.ringColor,
  emerald: THEME_COLOR_META_MAP.emerald.ringColor,
  rose: THEME_COLOR_META_MAP.rose.ringColor,
} as const);

export const THEME_COLOR_NAME_TO_BORDER_CLASS_MAP = Object.freeze({
  purple: THEME_COLOR_META_MAP.purple.borderColor,
  orange: THEME_COLOR_META_MAP.orange.borderColor,
  indigo: THEME_COLOR_META_MAP.indigo.borderColor,
  emerald: THEME_COLOR_META_MAP.emerald.borderColor,
  rose: THEME_COLOR_META_MAP.rose.borderColor,
} as const);

// Validate theme color class (type guard)
export const validateThemeColor = (colorClass: string): colorClass is SupportedThemeColor => {
  return Object.prototype.hasOwnProperty.call(THEME_COLOR_HEX_MAP, colorClass);
};

export const validateThemeName = (colorName: string): colorName is SupportedThemeName => {
  return Object.prototype.hasOwnProperty.call(THEME_COLOR_NAME_TO_CLASS_MAP, colorName);
};

// Theme name configured from env, only supports simple names like purple/orange
export const themeName: SupportedThemeName = (() => {
  const envColorRaw = process.env.NEXT_PUBLIC_STYLE_ICON_COLOR;
  const envColor = envColorRaw?.trim().toLowerCase();

  if (envColor) {
    if (validateThemeName(envColor)) {
      return envColor;
    }
  }

  console.warn(
    `[ThemeUtil] Invalid NEXT_PUBLIC_STYLE_ICON_COLOR: ${envColorRaw}. Fallback to purple.
    Supported names: ${Object.keys(THEME_COLOR_NAME_TO_CLASS_MAP).join(", ")}`
  );
  return "purple";
})();

// Theme icon text color (type-safe, global)
export const themeIconColor: SupportedThemeColor = THEME_COLOR_NAME_TO_CLASS_MAP[themeName];
export const themeBgColor: SupportedThemeBgColor = THEME_COLOR_NAME_TO_BG_CLASS_MAP[themeName];
export const themeViaColor: SupportedThemeViaColor = THEME_COLOR_NAME_TO_VIA_CLASS_MAP[themeName];
export const themeRingColor: SupportedThemeRingColor = THEME_COLOR_NAME_TO_RING_CLASS_MAP[themeName];
export const themeBorderColor: SupportedThemeBorderColor = THEME_COLOR_NAME_TO_BORDER_CLASS_MAP[themeName];
export const themeMainBgColor = "bg-neutral-100 dark:bg-neutral-900";

// SVG icon color (auto-derived, type-safe - NO any type)
export const themeSvgIconColor = THEME_COLOR_HEX_MAP[themeIconColor];

// SVG icon size (global)
export const themeSvgIconSize = process.env.NEXT_PUBLIC_STYLE_SVG_ICON_SIZE || 18;

// Theme button gradient classes (static for Tailwind scan)
export const THEME_BUTTON_GRADIENT_CLASS_MAP = Object.freeze({
  "text-purple-500": "bg-linear-to-r from-purple-400 to-pink-500 dark:from-purple-500 dark:to-pink-600",
  "text-orange-500": "bg-linear-to-r from-orange-500 to-orange-600 dark:from-orange-500 dark:to-orange-700",
  "text-indigo-500": "bg-linear-to-r from-indigo-400 to-blue-500 dark:from-indigo-500 dark:to-blue-600",
  "text-emerald-500": "bg-linear-to-r from-emerald-400 to-teal-500 dark:from-emerald-500 dark:to-teal-600",
  "text-rose-500": "bg-linear-to-r from-rose-400 to-pink-500 dark:from-rose-500 dark:to-pink-600",
} as const);

// Theme button hover gradient classes (static for Tailwind scan)
export const THEME_BUTTON_GRADIENT_HOVER_CLASS_MAP = Object.freeze({
  "text-purple-500": "hover:from-purple-500 hover:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-700",
  "text-orange-500": "hover:from-orange-500 hover:to-amber-600 dark:hover:from-orange-600 dark:hover:to-amber-700",
  "text-indigo-500": "hover:from-indigo-500 hover:to-blue-600 dark:hover:from-indigo-600 dark:hover:to-blue-700",
  "text-emerald-500": "hover:from-emerald-500 hover:to-teal-600 dark:hover:from-emerald-600 dark:hover:to-teal-700",
  "text-rose-500": "hover:from-rose-500 hover:to-pink-600 dark:hover:from-rose-600 dark:hover:to-pink-700",
} as const);

// Global button gradient classes (type-safe, follows themeIconColor)
export const themeButtonGradientClass = THEME_BUTTON_GRADIENT_CLASS_MAP[themeIconColor];
export const themeButtonGradientHoverClass = THEME_BUTTON_GRADIENT_HOVER_CLASS_MAP[themeIconColor];

// Theme hero text gradient classes (for bg-clip-text headlines)
export const THEME_HERO_EYES_ON_CLASS_MAP = Object.freeze({
  "text-purple-500": "bg-linear-to-r from-purple-400 to-pink-600",
  "text-orange-500": "bg-linear-to-r from-orange-500 to-red-500",
  "text-indigo-500": "bg-linear-to-r from-indigo-400 to-blue-600",
  "text-emerald-500": "bg-linear-to-r from-emerald-400 to-teal-600",
  "text-rose-500": "bg-linear-to-r from-rose-400 to-pink-600",
} as const);

export const themeHeroEyesOnClass = THEME_HERO_EYES_ON_CLASS_MAP[themeIconColor];

// Theme rich-text <mark> highlight background classes (darker emphasis, readable)
export const THEME_RICH_TEXT_MARK_CLASS_MAP = Object.freeze({
  "text-purple-500": "bg-purple-300 dark:bg-purple-600",
  "text-orange-500": "bg-orange-300 dark:bg-orange-600",
  "text-indigo-500": "bg-indigo-300 dark:bg-indigo-600",
  "text-emerald-500": "bg-emerald-300 dark:bg-emerald-600",
  "text-rose-500": "bg-rose-300 dark:bg-rose-600",
} as const);

export const themeRichTextMarkClass = THEME_RICH_TEXT_MARK_CLASS_MAP[themeIconColor];
