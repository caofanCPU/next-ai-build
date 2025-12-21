// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * Safely retrieves a translation using the provided translator function.
 * If the key does not exist (checked via `t.has(key)`), it returns the fallback value.
 *
 * @param t - The translator function from `next-intl` (e.g. obtained via `getTranslations` or `useTranslations`).
 * @param key - The translation key to look up.
 * @param fallback - The value to return if the key is missing. Defaults to an empty string.
 * @param values - Optional values for interpolation in the translation string.
 */
export function safeT(
  t: any,
  key: string,
  fallback: string = '',
  values?: any
): string {
  // Ensure t has the .has method before calling it, just in case
  if (t && typeof t.has === 'function' && t.has(key)) {
    return t(key, values);
  }
  return fallback;
}
