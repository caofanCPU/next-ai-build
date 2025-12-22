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
// @param locale - Current locale (e.g., 'en', 'zh', 'ja')
// @param path - Base path (e.g., '/blog', '/docs')
// @param localPrefixAsNeeded - Whether localePrefix is set to 'as-needed' (default: true)
// @param defaultLocale - The default locale for the application (default: 'en')
// @example
//   getAsNeededLocalizedUrl('en', '/blog', true, 'en')   // Returns '/blog'
//   getAsNeededLocalizedUrl('zh', '/blog', true, 'en')   // Returns '/zh/blog'
//   getAsNeededLocalizedUrl('en', '/blog', false, 'en')  // Returns '/en/blog'
export function getAsNeededLocalizedUrl(
  locale: string,
  path: string,
  localPrefixAsNeeded: boolean = true,
  defaultLocale: string = 'en'
): string {
  if (localPrefixAsNeeded && locale === defaultLocale) {
    return path;
  }
  return `/${locale}${path}`;
}