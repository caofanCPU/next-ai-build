/**
 * Fingerprint Shared Utilities
 * Shared constants, types, and validation logic for client and server.
 */

// Storage keys and header names for fingerprint IDs.
export const FINGERPRINT_STORAGE_KEY = '__x_fingerprint_id';
export const FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY = '__x_fingerprint_debug_override';
export const FINGERPRINT_HEADER_NAME = 'x-fingerprint-id-v8';
export const FINGERPRINT_COOKIE_NAME = '__x_fingerprint_id';
export const FINGERPRINT_SOURCE_REFER = 'x-source-ref';
export const FINGERPRINT_FIRST_TOUCH_STORAGE_KEY = '__x_first_touch';
export const FINGERPRINT_FIRST_TOUCH_COOKIE_NAME = '__x_first_touch';
export const FINGERPRINT_FIRST_TOUCH_HEADER = 'x-first-touch';
export const FINGERPRINT_DEBUG_PREFIX = 'fp_test_dbg_';

/**
 * Validate fingerprint ID format.
 * Safe to use on both client and server.
 */
export function isValidFingerprintId(fingerprintId: string): boolean {
  if (!fingerprintId) return false;
  // Supported formats:
  // - fp_ + FingerprintJS visitorId with variable length.
  // - fp_fallback_ + timestamp + random string for client fallback.
  // - fp_server_ + timestamp + random string for server fallback.
  // - fp_test_dbg_ + timestamp + random string for debug concurrency tests.
  return /^fp(_fallback|_server|_test_dbg)?_[a-zA-Z0-9_]+$/.test(fingerprintId);
}

export function isDebugFingerprintId(fingerprintId: string | null | undefined): boolean {
  if (!fingerprintId) {
    return false;
  }

  return fingerprintId.startsWith(FINGERPRINT_DEBUG_PREFIX);
}

// Exported constants.
export const FINGERPRINT_CONSTANTS = {
  STORAGE_KEY: FINGERPRINT_STORAGE_KEY,
  DEBUG_OVERRIDE_STORAGE_KEY: FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY,
  HEADER_NAME: FINGERPRINT_HEADER_NAME,
  COOKIE_NAME: FINGERPRINT_COOKIE_NAME,
  FIRST_TOUCH_STORAGE_KEY: FINGERPRINT_FIRST_TOUCH_STORAGE_KEY,
  FIRST_TOUCH_COOKIE_NAME: FINGERPRINT_FIRST_TOUCH_COOKIE_NAME,
  FIRST_TOUCH_HEADER: FINGERPRINT_FIRST_TOUCH_HEADER,
  DEBUG_PREFIX: FINGERPRINT_DEBUG_PREFIX,
} as const;
