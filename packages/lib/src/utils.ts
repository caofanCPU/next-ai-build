import type * as React from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function viewLocalTime(origin: Date | null) {
  return formatTimestamp(origin?.getTime().toString() ?? "", 'yyyy-MM-dd HH:mm:ss');
}

export function formatTimestamp(timestamp: string, formatter: string) {
  const fail = "";
  if (!timestamp) {
    return fail;
  }

  // Assume gitTimestamp is a millisecond timestamp string
  const timestampMs = parseInt(timestamp, 10);
  if (isNaN(timestampMs)) {
     return fail;
  }

  const date = new Date(timestampMs); // or if it is determined to be seconds, use fromUnixTime(timestampSeconds)

  // Check if the date is valid
  if (!isValid(date)) {
    return fail;
  }

  // Format the date
  try {
     // 'yyyy-MM-dd HH:mm:ss' is the date-fns formatting pattern
     return format(date, formatter);
  } catch (error) {
     // format may also throw an error due to an invalid date (although isValid should have already caught it)
     console.error("Error formatting date:", error);
     return fail;
  }
}

// Only allow pasting plain text, prohibit style content
export function handlePastePlainText(e: React.ClipboardEvent<HTMLElement>) {
  e.preventDefault();
  const text = e.clipboardData.getData('text/plain');
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;
  // Delete the current selected content
  selection.deleteFromDocument();
  // Insert plain text
  const textNode = document.createTextNode(text);
  const range = selection.getRangeAt(0);
  range.insertNode(textNode);
  // Move the cursor to the inserted text
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

// Generates localized URL based on locale and locale prefix configuration
// Supports both 'as-needed' and 'always' localePrefix configurations
// Ensures URLs have proper trailing slash handling:
// - Root path (domain only) has trailing slash: '/'
// - All other paths have no trailing slash: '/blog', '/zh/blog', '/en'
// @param locale - Current locale (e.g., 'en', 'zh', 'ja')
// @param path - Base path (e.g., '/', '/blog', '/docs', or '' treated as '/')
// @param localPrefixAsNeeded - Whether localePrefix is set to 'as-needed' (default: true)
// @param defaultLocale - The default locale for the application (default: 'en')
// @example
//   getAsNeededLocalizedUrl('en', '/', true, 'en')       // Returns '/'
//   getAsNeededLocalizedUrl('zh', '/', true, 'en')       // Returns '/zh'
//   getAsNeededLocalizedUrl('en', '/blog', true, 'en')   // Returns '/blog'
//   getAsNeededLocalizedUrl('zh', '/blog', true, 'en')   // Returns '/zh/blog'
//   getAsNeededLocalizedUrl('en', '/blog/', true, 'en')  // Returns '/blog'
//   getAsNeededLocalizedUrl('en', '/', false, 'en')      // Returns '/en'
export function getAsNeededLocalizedUrl(
  locale: string,
  path: string,
  localPrefixAsNeeded: boolean = true,
  defaultLocale: string = 'en'
): string {
  // Normalize path: empty string or undefined treated as '/'
  let normalizedPath = (path || '/').trim();

  // Ensure path starts with '/'
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Remove trailing slashes except for root path '/'
  if (normalizedPath !== '/' && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.replace(/\/+$/, '');
  }

  // Return based on locale prefix configuration
  if (localPrefixAsNeeded && locale === defaultLocale) {
    return normalizedPath;
  }

  // Add locale prefix, but avoid double trailing slash when path is '/'
  if (normalizedPath === '/') {
    return `/${locale}`;
  }

  return `/${locale}${normalizedPath}`;
}