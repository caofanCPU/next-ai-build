'use client';

import {
  FINGERPRINT_DEBUG_PREFIX,
  FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY,
  isDebugFingerprintId,
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
  if (!value || !isValidFingerprintId(value) || !isDebugFingerprintId(value)) {
    return null;
  }

  return value;
}

export function setDebugFingerprintOverride(fingerprintId: string): void {
  if (!isValidFingerprintId(fingerprintId) || !isDebugFingerprintId(fingerprintId)) {
    throw new Error('Invalid fingerprint ID');
  }

  setLocalStorageValue(FINGERPRINT_DEBUG_OVERRIDE_STORAGE_KEY, fingerprintId);
}

export function buildDebugFingerprintId(): string {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `${FINGERPRINT_DEBUG_PREFIX}${timestamp}_${randomSuffix}`;
}

export function getOrCreateDebugFingerprintOverride(): string {
  const existing = getDebugFingerprintOverride();
  if (existing) {
    return existing;
  }

  const nextFingerprintId = buildDebugFingerprintId();
  setDebugFingerprintOverride(nextFingerprintId);
  return nextFingerprintId;
}

export function regenerateDebugFingerprintOverride(): string {
  const nextFingerprintId = buildDebugFingerprintId();
  setDebugFingerprintOverride(nextFingerprintId);
  return nextFingerprintId;
}
