'use client';

import {
  FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY,
  isValidFingerprintId,
} from './fingerprint-shared';

function getLocalStorageValue(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageValue(key: string, value: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in debug helpers.
  }
}

export function getDebugFingerprintOverride(): string | null {
  const value = getLocalStorageValue(FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY);
  if (!value || !isValidFingerprintId(value)) {
    return null;
  }

  return value;
}

export function setDebugFingerprintOverride(fingerprintId: string): void {
  if (!isValidFingerprintId(fingerprintId)) {
    throw new Error('Invalid fingerprint ID');
  }

  setLocalStorageValue(FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY, fingerprintId);
}
