/**
 * Fingerprint Client Utilities
 * 客户端专用的指纹生成和管理逻辑
 * 只能在浏览器环境中使用
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  FINGERPRINT_COOKIE_NAME,
  FINGERPRINT_FIRST_TOUCH_COOKIE_NAME,
  FINGERPRINT_FIRST_TOUCH_HEADER,
  FINGERPRINT_FIRST_TOUCH_STORAGE_KEY,
  FINGERPRINT_HEADER_NAME,
  FINGERPRINT_SOURCE_REFER,
  FINGERPRINT_STORAGE_KEY,
  isValidFingerprintId
} from './fingerprint-shared';

const FIRST_TOUCH_MAX_LENGTH = 2048;
const FIRST_TOUCH_COOKIE_DAYS = 30;

type FirstTouchData = {
  landingUrl?: string;
  landingPath?: string;
  landingHost?: string;
  externalReferrer?: string;
  capturedAt?: string;
  ref?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  utmId?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  twclid?: string;
  liFatId?: string;
};

/**
 * 检查浏览器存储（localStorage 和 cookie）中的指纹 ID
 * 返回有效的 ID 或 null
 */
function checkStoredFingerprintId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // 优先检查 localStorage
  const localStorageId = getLocalStorageValue(FINGERPRINT_STORAGE_KEY);
  if (localStorageId && isValidFingerprintId(localStorageId)) {
    return localStorageId;
  }

  // 检查 cookie
  const cookieId = getCookieValue(FINGERPRINT_COOKIE_NAME);
  if (cookieId && isValidFingerprintId(cookieId)) {
    // 同步到 localStorage
    setLocalStorageValue(FINGERPRINT_STORAGE_KEY, cookieId);
    return cookieId;
  }

  return null;
}

function normalizeString(value: string | null | undefined, maxLength = FIRST_TOUCH_MAX_LENGTH): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function readFirstTouchFromStorage(): FirstTouchData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const localStorageValue = getLocalStorageValue(FINGERPRINT_FIRST_TOUCH_STORAGE_KEY);
  if (localStorageValue) {
    const parsed = parseFirstTouchValue(localStorageValue);
    if (parsed) {
      syncFirstTouchStorage(parsed);
      return parsed;
    }
  }

  const cookieValue = getCookieValue(FINGERPRINT_FIRST_TOUCH_COOKIE_NAME);
  if (cookieValue) {
    const parsed = parseFirstTouchValue(cookieValue);
    if (parsed) {
      syncFirstTouchStorage(parsed);
      return parsed;
    }
  }

  return null;
}

function parseFirstTouchValue(value: string): FirstTouchData | null {
  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as FirstTouchData;
    return sanitizeFirstTouchData(parsed);
  } catch {
    return null;
  }
}

function sanitizeFirstTouchData(data: FirstTouchData | null | undefined): FirstTouchData | null {
  if (!data) {
    return null;
  }

  const sanitized: FirstTouchData = {
    landingUrl: normalizeString(data.landingUrl),
    landingPath: normalizeString(data.landingPath, 512),
    landingHost: normalizeString(data.landingHost, 255),
    externalReferrer: normalizeString(data.externalReferrer),
    capturedAt: normalizeString(data.capturedAt, 64),
    ref: normalizeString(data.ref, 512),
    utmSource: normalizeString(data.utmSource, 512),
    utmMedium: normalizeString(data.utmMedium, 512),
    utmCampaign: normalizeString(data.utmCampaign, 512),
    utmTerm: normalizeString(data.utmTerm, 512),
    utmContent: normalizeString(data.utmContent, 512),
    utmId: normalizeString(data.utmId, 512),
    gclid: normalizeString(data.gclid, 512),
    fbclid: normalizeString(data.fbclid, 512),
    msclkid: normalizeString(data.msclkid, 512),
    ttclid: normalizeString(data.ttclid, 512),
    twclid: normalizeString(data.twclid, 512),
    liFatId: normalizeString(data.liFatId, 512),
  };

  return Object.values(sanitized).some(Boolean) ? sanitized : null;
}

function serializeFirstTouchData(data: FirstTouchData): string {
  return encodeURIComponent(JSON.stringify(data));
}

function syncFirstTouchStorage(data: FirstTouchData): void {
  if (typeof window === 'undefined') {
    return;
  }

  const serialized = serializeFirstTouchData(data);
  setLocalStorageValue(FINGERPRINT_FIRST_TOUCH_STORAGE_KEY, serialized);
  setCookie(FINGERPRINT_FIRST_TOUCH_COOKIE_NAME, serialized, FIRST_TOUCH_COOKIE_DAYS);
}

function buildFirstTouchData(): FirstTouchData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const data = sanitizeFirstTouchData({
    landingUrl: url.toString(),
    landingPath: url.pathname,
    landingHost: url.host,
    externalReferrer: document.referrer || undefined,
    capturedAt: new Date().toISOString(),
    ref: url.searchParams.get('ref') ?? undefined,
    utmSource: url.searchParams.get('utm_source') ?? undefined,
    utmMedium: url.searchParams.get('utm_medium') ?? undefined,
    utmCampaign: url.searchParams.get('utm_campaign') ?? undefined,
    utmTerm: url.searchParams.get('utm_term') ?? undefined,
    utmContent: url.searchParams.get('utm_content') ?? undefined,
    utmId: url.searchParams.get('utm_id') ?? undefined,
    gclid: url.searchParams.get('gclid') ?? undefined,
    fbclid: url.searchParams.get('fbclid') ?? undefined,
    msclkid: url.searchParams.get('msclkid') ?? undefined,
    ttclid: url.searchParams.get('ttclid') ?? undefined,
    twclid: url.searchParams.get('twclid') ?? undefined,
    liFatId: url.searchParams.get('li_fat_id') ?? undefined,
  });

  return data;
}

export function getOrCreateFirstTouchData(): FirstTouchData | null {
  const existing = readFirstTouchFromStorage();
  if (existing) {
    return existing;
  }

  const created = buildFirstTouchData();
  if (created) {
    syncFirstTouchStorage(created);
  }

  return created;
}

/**
 * 生成基于真实浏览器特征的fingerprint ID
 * 使用 FingerprintJS 收集浏览器特征并生成唯一标识
 */
export async function generateFingerprintId(): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('generateFingerprintId can only be used in browser environment');
  }

  // 检查现有 ID
  const existingId = checkStoredFingerprintId();
  if (existingId) {
    console.log('Using existing fingerprint ID:', existingId);
    return existingId;
  }

  try {
    // 使用 FingerprintJS 生成指纹
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    const fingerprintId = `fp_${result.visitorId}`;

    // 存储到 localStorage 和 cookie
    setLocalStorageValue(FINGERPRINT_STORAGE_KEY, fingerprintId);
    setCookie(FINGERPRINT_COOKIE_NAME, fingerprintId, 365);

    console.log('Generated new fingerprint ID:', fingerprintId);
    return fingerprintId;
  } catch (error) {
    console.warn('Failed to generate fingerprint with FingerprintJS:', error);
    // 降级方案：生成基于时间戳和随机数的 ID
    const fallbackId = `fp_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    setLocalStorageValue(FINGERPRINT_STORAGE_KEY, fallbackId);
    setCookie(FINGERPRINT_COOKIE_NAME, fallbackId, 365);

    console.log('Generated fallback fingerprint ID:', fallbackId);
    return fallbackId;
  }
}

/**
 * 获取当前的fingerprint ID
 */
export function getFingerprintId(): string | null {
  return checkStoredFingerprintId();
}

/**
 * 设置fingerprint ID到存储
 */
export function setFingerprintId(fingerprintId: string): void {
  if (typeof window === 'undefined') {
    throw new Error('setFingerprintId can only be used in browser environment');
  }

  if (!isValidFingerprintId(fingerprintId)) {
    throw new Error('Invalid fingerprint ID');
  }

  setLocalStorageValue(FINGERPRINT_STORAGE_KEY, fingerprintId);
  setCookie(FINGERPRINT_COOKIE_NAME, fingerprintId, 365);
}

/**
 * 清除fingerprint ID
 */
export function clearFingerprintId(): void {
  if (typeof window === 'undefined') {
    throw new Error('clearFingerprintId can only be used in browser environment');
  }

  removeLocalStorageValue(FINGERPRINT_STORAGE_KEY);
  deleteCookie(FINGERPRINT_COOKIE_NAME);
}

/**
 * 获取或生成fingerprint ID
 * 如果不存在则自动生成新的
 */
export async function getOrGenerateFingerprintId(): Promise<string> {
  const existingId = checkStoredFingerprintId();
  if (existingId) {
    console.log('Retrieved existing fingerprint ID:', existingId);
    return existingId;
  }

  return await generateFingerprintId();
}

/**
 * 创建包含fingerprint ID的fetch headers
 */
export async function createFingerprintHeaders(): Promise<Record<string, string>> {
  const fingerprintId = await getOrGenerateFingerprintId();
  const headers: Record<string, string> = {
    [FINGERPRINT_HEADER_NAME]: fingerprintId,
  };

  const firstTouch = getOrCreateFirstTouchData();
  if (firstTouch) {
    headers[FINGERPRINT_FIRST_TOUCH_HEADER] = serializeFirstTouchData(firstTouch);
  }

  return headers;
}

/**
 * Hook for generating fingerprint headers
 */
export function useFingerprintHeaders(): () => Promise<Record<string, string>> {
  return createFingerprintHeaders;
}

/**
 * Create a fetch wrapper that automatically includes fingerprint headers
 */
export function createFingerprintFetch() {
  return async (url: string | URL | Request, init?: RequestInit) => {
    const fingerprintHeaders = await createFingerprintHeaders();
    const headers = {
      ...fingerprintHeaders,
      [FINGERPRINT_SOURCE_REFER]: document.referrer || '',
      ...(init?.headers || {}),
    };

    return fetch(url, {
      ...init,
      headers,
    });
  };
}

// Cookie 辅助函数 (私有)
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  } catch {
    return null;
  }
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch {
    // Ignore storage failures so attribution never blocks page flow.
  }
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  } catch {
    // Ignore storage failures so attribution never blocks page flow.
  }
}

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
    // Ignore storage failures so attribution never blocks page flow.
  }
}

function removeLocalStorageValue(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures so attribution never blocks page flow.
  }
}
