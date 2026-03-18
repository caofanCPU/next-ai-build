/**
 * Theme style utility (TypeScript)
 * Maintainer: xxx
 * Note:
 * 1. Static color classes for Tailwind CSS 4.x scanning
 * 2. Single config: NEXT_PUBLIC_STYLE_ICON_COLOR (Tailwind class only)
 * 3. Premium/elegant color system (uppercase hex values)
 */

// Define type for supported theme color classes (literal type)
export type SupportedThemeColor = keyof typeof THEME_COLOR_HEX_MAP;
export type SupportedThemeName = keyof typeof THEME_COLOR_NAME_TO_CLASS_MAP;

// Supported theme color classes (static for Tailwind scan)
export const __SUPPORTED_THEME_COLORS = Object.freeze({
  "text-purple-500": "典雅紫·清",
  "text-orange-500": "轻奢橙·暖",
  "text-indigo-500": "沉稳蓝·冷",
  "text-emerald-500": "温润绿·愈",
  "text-rose-500": "玫瑰红·柔"
} as const);

// Hex color map (uppercase, match Tailwind classes)
export const THEME_COLOR_HEX_MAP = Object.freeze({
  "text-purple-500": "#AC62FD",
  "text-orange-500": "#F97316",
  "text-indigo-500": "#6366F1",
  "text-emerald-500": "#10B981",
  "text-rose-500": "#F43F5E",
} as const);

// Short theme names for env configuration
export const THEME_COLOR_NAME_TO_CLASS_MAP = Object.freeze({
  purple: "text-purple-500",
  orange: "text-orange-500",
  indigo: "text-indigo-500",
  emerald: "text-emerald-500",
  rose: "text-rose-500",
} as const);

// Validate theme color class (type guard)
export const validateThemeColor = (colorClass: string): colorClass is SupportedThemeColor => {
  return Object.prototype.hasOwnProperty.call(THEME_COLOR_HEX_MAP, colorClass);
};

export const validateThemeName = (colorName: string): colorName is SupportedThemeName => {
  return Object.prototype.hasOwnProperty.call(THEME_COLOR_NAME_TO_CLASS_MAP, colorName);
};

// Theme icon text color (type-safe, global)
export const themeIconColor: SupportedThemeColor = (() => {
  const envColorRaw = process.env.NEXT_PUBLIC_STYLE_ICON_COLOR;
  const envColor = envColorRaw?.trim().toLowerCase();
  if (envColor) {
    if (validateThemeName(envColor)) {
      return THEME_COLOR_NAME_TO_CLASS_MAP[envColor];
    }
    // backward compatible: allow old full tailwind class value
    if (validateThemeColor(envColor)) {
      return envColor;
    }
  }
  
  console.warn(
    `[ThemeUtil] Invalid NEXT_PUBLIC_STYLE_ICON_COLOR: ${envColorRaw}. Fallback to text-purple-500.
    Supported names: ${Object.keys(THEME_COLOR_NAME_TO_CLASS_MAP).join(", ")}
    Supported classes(legacy): ${Object.keys(THEME_COLOR_HEX_MAP).join(", ")}`
  );
  return "text-purple-500";
})();

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
