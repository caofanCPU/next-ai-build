/* eslint-disable @typescript-eslint/no-explicit-any */

// Fix BigInt serialization issue
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { anonymousAggregateService } from '@/aggregate/anonymous.aggregate.service';
import type { XCredit, XSubscription, XUser } from '@windrun-huaiin/third-ui/fingerprint';
import { extractFingerprintFromNextRequest } from '@windrun-huaiin/third-ui/fingerprint/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  fetchLatestUserContextByFingerprintId,
  fetchUserContextByClerkUserId,
  mapCreditToXCredit,
  mapSubscriptionToXSubscription,
  mapUserToXUser,
  type UserContextEntities,
} from '@/context/user-context-service';
import { finalizeUserContext } from '@/context/user-context-finalizer';

import type { Prisma } from '@/db/prisma-model-type';


// ==================== 类型定义 ====================

/** 成功响应数据 */
interface XUserResponse {
  success: true;
  xUser: XUser;
  xCredit: XCredit | null;
  xSubscription: XSubscription | null;
  isNewUser: boolean;
  totalUsersOnDevice?: number;
  hasAnonymousUser?: boolean;
}

/** 错误响应数据 */
interface ErrorResponse {
  error: string;
}

// ==================== 工具函数 ====================

/** 创建成功响应对象 */
function createSuccessResponse(params: {
  entities: UserContextEntities;
  isNewUser: boolean;
  options?: {
    totalUsersOnDevice?: number;
    hasAnonymousUser?: boolean;
  };
}): XUserResponse {
  const response: XUserResponse = {
    success: true,
    xUser: mapUserToXUser(params.entities.user),
    xCredit: params.entities.credit ? mapCreditToXCredit(params.entities.credit) : null,
    xSubscription: mapSubscriptionToXSubscription(params.entities.subscription),
    isNewUser: params.isNewUser,
    ...params.options,
  };

  return finalizeUserContext(response);
}

/** 创建错误响应 */
function createErrorResponse(message: string, status = 400): NextResponse {
  const errorResponse: ErrorResponse = { error: message };
  return NextResponse.json(errorResponse, { status });
}

type SourceRefData = Prisma.InputJsonObject & {
  capturedAt?: string;
  landingUrl?: string;
  landingPath?: string;
  landingHost?: string;
  httpRefer?: string;
  refererHost?: string;
  refererPath?: string;
  refererDomain?: string;
  sourceType?: string;
  sourceChannel?: string;
  sourcePlatform?: string;
  isInternalReferer?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  utmId?: string;
  ref?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  twclid?: string;
  liFatId?: string;
  userAgent?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  secChUaMobile?: string;
  secChUaPlatform?: string;
};

type SourceRefKey =
  | 'utmSource'
  | 'utmMedium'
  | 'utmCampaign'
  | 'utmTerm'
  | 'utmContent'
  | 'utmId'
  | 'ref'
  | 'gclid'
  | 'fbclid'
  | 'msclkid'
  | 'ttclid'
  | 'twclid'
  | 'liFatId';

const SOURCE_REF_MAX_LENGTH = 2048;
const QUERY_PARAM_MAX_LENGTH = 512;
const USER_AGENT_MAX_LENGTH = 1024;
const FIRST_TOUCH_HEADER_MAX_LENGTH = 4096;
const FIRST_TOUCH_HEADER_NAME = 'x-first-touch';

function normalizeSourceRef(ref: string | null): string | null {
  if (!ref) {
    return null;
  }

  const trimmed = ref.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > SOURCE_REF_MAX_LENGTH
    ? trimmed.slice(0, SOURCE_REF_MAX_LENGTH)
    : trimmed;
}

function normalizeQueryParam(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > QUERY_PARAM_MAX_LENGTH
    ? trimmed.slice(0, QUERY_PARAM_MAX_LENGTH)
    : trimmed;
}

function decodeHeaderValue(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function mergeSourceRef(target: SourceRefData, source: SourceRefData | null | undefined) {
  if (!source) {
    return;
  }

  const entries = Object.entries(source) as Array<[keyof SourceRefData, SourceRefData[keyof SourceRefData]]>;
  for (const [key, value] of entries) {
    if (value === undefined || value === null) {
      continue;
    }

    if (target[key] === undefined) {
      (target as Record<string, unknown>)[key as string] = value;
    }
  }
}

function applySearchParams(sourceRef: SourceRefData, params: URLSearchParams) {
  const setIfEmpty = (key: SourceRefKey, value: string | null) => {
    if (sourceRef[key] !== undefined) {
      return;
    }
    const normalized = normalizeQueryParam(value);
    if (normalized) {
      sourceRef[key] = normalized;
    }
  };

  setIfEmpty('utmSource', params.get('utm_source'));
  setIfEmpty('utmMedium', params.get('utm_medium'));
  setIfEmpty('utmCampaign', params.get('utm_campaign'));
  setIfEmpty('utmTerm', params.get('utm_term'));
  setIfEmpty('utmContent', params.get('utm_content'));
  setIfEmpty('utmId', params.get('utm_id'));
  setIfEmpty('ref', params.get('ref'));
  setIfEmpty('gclid', params.get('gclid'));
  setIfEmpty('fbclid', params.get('fbclid'));
  setIfEmpty('msclkid', params.get('msclkid'));
  setIfEmpty('ttclid', params.get('ttclid'));
  setIfEmpty('twclid', params.get('twclid'));
  setIfEmpty('liFatId', params.get('li_fat_id'));
}

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) {
    return null;
  }

  return host.trim().toLowerCase() || null;
}

function getRootDomain(host: string | null | undefined): string | null {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) {
    return null;
  }

  const hostname = normalizedHost.split(':')[0];
  if (hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return hostname;
  }

  const parts = hostname.split('.').filter(Boolean);
  if (parts.length <= 2) {
    return hostname;
  }

  return parts.slice(-2).join('.');
}

function isInternalReferer(landingHost: string | null | undefined, refererHost: string | null | undefined): boolean {
  const normalizedLandingHost = normalizeHost(landingHost);
  const normalizedRefererHost = normalizeHost(refererHost);
  if (!normalizedLandingHost || !normalizedRefererHost) {
    return false;
  }

  if (normalizedLandingHost === normalizedRefererHost) {
    return true;
  }

  return normalizedLandingHost.endsWith(`.${normalizedRefererHost}`)
    || normalizedRefererHost.endsWith(`.${normalizedLandingHost}`);
}

function detectPlatform(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const matcherList: Array<{ pattern: RegExp; platform: string; channel: string; }> = [
    { pattern: /chatgpt|chat-openai|openai/, platform: 'openai', channel: 'ai' },
    { pattern: /claude|anthropic/, platform: 'anthropic', channel: 'ai' },
    { pattern: /perplexity/, platform: 'perplexity', channel: 'ai' },
    { pattern: /gemini/, platform: 'gemini', channel: 'ai' },
    { pattern: /copilot/, platform: 'copilot', channel: 'ai' },
    { pattern: /google/, platform: 'google', channel: 'search' },
    { pattern: /bing/, platform: 'bing', channel: 'search' },
    { pattern: /baidu/, platform: 'baidu', channel: 'search' },
    { pattern: /yahoo/, platform: 'yahoo', channel: 'search' },
    { pattern: /duckduckgo/, platform: 'duckduckgo', channel: 'search' },
    { pattern: /facebook/, platform: 'facebook', channel: 'social' },
    { pattern: /instagram/, platform: 'instagram', channel: 'social' },
    { pattern: /x\.com|twitter/, platform: 'x', channel: 'social' },
    { pattern: /linkedin/, platform: 'linkedin', channel: 'social' },
    { pattern: /reddit/, platform: 'reddit', channel: 'social' },
    { pattern: /youtube/, platform: 'youtube', channel: 'social' },
  ];

  const matched = matcherList.find(({ pattern }) => pattern.test(normalized));
  if (!matched) {
    return null;
  }

  return matched.platform;
}

function detectChannelFromPlatform(platform: string | null | undefined): string | null {
  switch (platform) {
    case 'openai':
    case 'anthropic':
    case 'perplexity':
    case 'gemini':
    case 'copilot':
      return 'ai';
    case 'google':
    case 'bing':
    case 'baidu':
    case 'yahoo':
    case 'duckduckgo':
      return 'search';
    case 'facebook':
    case 'instagram':
    case 'x':
    case 'linkedin':
    case 'reddit':
    case 'youtube':
      return 'social';
    default:
      return null;
  }
}

function detectChannelFromUtmMedium(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (/^(cpc|ppc|paid|paid_search|display|banner|affiliate|email|newsletter|push|sms)$/.test(normalized)) {
    return 'campaign';
  }

  if (/^(social|social_paid|social-organic|social_organic)$/.test(normalized)) {
    return 'social';
  }

  if (/^(organic|seo|search)$/.test(normalized)) {
    return 'search';
  }

  if (/^(referral|partner)$/.test(normalized)) {
    return 'referral';
  }

  if (/^(ai|llm)$/.test(normalized)) {
    return 'ai';
  }

  return 'campaign';
}

function parseUserAgent(request: NextRequest): Pick<SourceRefData, 'userAgent' | 'deviceType' | 'os' | 'browser' | 'secChUaMobile' | 'secChUaPlatform'> {
  const userAgentHeader = request.headers.get('user-agent');
  const secChUaMobile = normalizeQueryParam(request.headers.get('sec-ch-ua-mobile')) ?? undefined;
  const secChUaPlatform = normalizeQueryParam(request.headers.get('sec-ch-ua-platform')) ?? undefined;
  const userAgent = normalizeSourceRef(userAgentHeader)?.slice(0, USER_AGENT_MAX_LENGTH) ?? undefined;
  const ua = userAgent?.toLowerCase() ?? '';

  let deviceType = 'desktop';
  if (!ua) {
    deviceType = 'unknown';
  } else if (/bot|spider|crawler|curl|wget|headless/.test(ua)) {
    deviceType = 'bot';
  } else if (/ipad|tablet/.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobi|iphone|android/.test(ua) || secChUaMobile === '?1') {
    deviceType = 'mobile';
  }

  let os = 'Unknown';
  if (/iphone|ipad|ipod/.test(ua)) {
    os = 'iOS';
  } else if (/android/.test(ua)) {
    os = 'Android';
  } else if (/windows nt/.test(ua)) {
    os = 'Windows';
  } else if (/mac os x|macintosh/.test(ua)) {
    os = 'macOS';
  } else if (/cros/.test(ua)) {
    os = 'Chrome OS';
  } else if (/linux/.test(ua)) {
    os = 'Linux';
  }

  if (secChUaPlatform) {
    const normalizedPlatform = secChUaPlatform.replaceAll('"', '');
    if (normalizedPlatform && normalizedPlatform !== 'Unknown') {
      os = normalizedPlatform;
    }
  }

  let browser = 'Unknown';
  if (/edg\//.test(ua)) {
    browser = 'Edge';
  } else if (/opr\//.test(ua) || /opera/.test(ua)) {
    browser = 'Opera';
  } else if (/samsungbrowser\//.test(ua)) {
    browser = 'Samsung Internet';
  } else if (/crios\//.test(ua) || /chrome\//.test(ua)) {
    browser = 'Chrome';
  } else if (/firefox\//.test(ua)) {
    browser = 'Firefox';
  } else if (/safari\//.test(ua) && !/chrome\//.test(ua) && !/crios\//.test(ua)) {
    browser = 'Safari';
  }

  return {
    userAgent,
    deviceType,
    os,
    browser,
    secChUaMobile,
    secChUaPlatform,
  };
}

function parseFirstTouchHeader(request: NextRequest): SourceRefData | null {
  const rawHeader = request.headers.get(FIRST_TOUCH_HEADER_NAME);
  const normalizedHeader = normalizeSourceRef(rawHeader)?.slice(0, FIRST_TOUCH_HEADER_MAX_LENGTH);
  if (!normalizedHeader) {
    return null;
  }

  const decodedHeader = decodeHeaderValue(normalizedHeader);
  if (!decodedHeader) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodedHeader) as Record<string, unknown>;
    const sourceRef: SourceRefData = {};

    sourceRef.capturedAt = normalizeQueryParam(typeof parsed.capturedAt === 'string' ? parsed.capturedAt : null) ?? undefined;
    sourceRef.landingUrl = normalizeSourceRef(typeof parsed.landingUrl === 'string' ? parsed.landingUrl : null) ?? undefined;
    sourceRef.landingPath = normalizeSourceRef(typeof parsed.landingPath === 'string' ? parsed.landingPath : null) ?? undefined;
    sourceRef.landingHost = normalizeHost(typeof parsed.landingHost === 'string' ? parsed.landingHost : null) ?? undefined;
    sourceRef.ref = normalizeQueryParam(typeof parsed.ref === 'string' ? parsed.ref : null) ?? undefined;
    sourceRef.utmSource = normalizeQueryParam(typeof parsed.utmSource === 'string' ? parsed.utmSource : null) ?? undefined;
    sourceRef.utmMedium = normalizeQueryParam(typeof parsed.utmMedium === 'string' ? parsed.utmMedium : null) ?? undefined;
    sourceRef.utmCampaign = normalizeQueryParam(typeof parsed.utmCampaign === 'string' ? parsed.utmCampaign : null) ?? undefined;
    sourceRef.utmTerm = normalizeQueryParam(typeof parsed.utmTerm === 'string' ? parsed.utmTerm : null) ?? undefined;
    sourceRef.utmContent = normalizeQueryParam(typeof parsed.utmContent === 'string' ? parsed.utmContent : null) ?? undefined;
    sourceRef.utmId = normalizeQueryParam(typeof parsed.utmId === 'string' ? parsed.utmId : null) ?? undefined;
    sourceRef.gclid = normalizeQueryParam(typeof parsed.gclid === 'string' ? parsed.gclid : null) ?? undefined;
    sourceRef.fbclid = normalizeQueryParam(typeof parsed.fbclid === 'string' ? parsed.fbclid : null) ?? undefined;
    sourceRef.msclkid = normalizeQueryParam(typeof parsed.msclkid === 'string' ? parsed.msclkid : null) ?? undefined;
    sourceRef.ttclid = normalizeQueryParam(typeof parsed.ttclid === 'string' ? parsed.ttclid : null) ?? undefined;
    sourceRef.twclid = normalizeQueryParam(typeof parsed.twclid === 'string' ? parsed.twclid : null) ?? undefined;
    sourceRef.liFatId = normalizeQueryParam(typeof parsed.liFatId === 'string' ? parsed.liFatId : null) ?? undefined;

    const externalReferrer = normalizeSourceRef(typeof parsed.externalReferrer === 'string' ? parsed.externalReferrer : null);
    if (externalReferrer) {
      sourceRef.httpRefer = externalReferrer;
      try {
        const refererUrl = new URL(externalReferrer);
        sourceRef.refererHost = normalizeHost(refererUrl.host) ?? undefined;
        sourceRef.refererPath = normalizeSourceRef(refererUrl.pathname) ?? undefined;
        sourceRef.refererDomain = getRootDomain(refererUrl.host) ?? undefined;
        applySearchParams(sourceRef, refererUrl.searchParams);
      } catch (error) {
        console.warn('Failed to parse first-touch referrer url:', error);
      }
    }

    return Object.keys(sourceRef).length > 0 ? sourceRef : null;
  } catch (error) {
    console.warn('Failed to parse first-touch header:', error);
    return null;
  }
}

function finalizeAttribution(sourceRef: SourceRefData) {
  const landingHost = normalizeHost(sourceRef.landingHost);
  const refererHost = normalizeHost(sourceRef.refererHost);
  const internal = isInternalReferer(landingHost, refererHost);
  const hasCampaignMarker = Boolean(
    sourceRef.utmSource
    || sourceRef.utmMedium
    || sourceRef.utmCampaign
    || sourceRef.utmTerm
    || sourceRef.utmContent
    || sourceRef.utmId
    || sourceRef.ref
    || sourceRef.gclid
    || sourceRef.fbclid
    || sourceRef.msclkid
    || sourceRef.ttclid
    || sourceRef.twclid
    || sourceRef.liFatId
  );
  if (internal) {
    sourceRef.isInternalReferer = true;
  }

  const utmPlatform = detectPlatform(sourceRef.utmSource) || detectPlatform(sourceRef.ref);
  if (utmPlatform) {
    sourceRef.sourcePlatform = utmPlatform;
    sourceRef.sourceChannel = detectChannelFromPlatform(utmPlatform)
      ?? detectChannelFromUtmMedium(sourceRef.utmMedium)
      ?? sourceRef.sourceChannel
      ?? 'campaign';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (sourceRef.gclid) {
    sourceRef.sourcePlatform = 'google';
    sourceRef.sourceChannel = 'search';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (sourceRef.msclkid) {
    sourceRef.sourcePlatform = 'bing';
    sourceRef.sourceChannel = 'search';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (sourceRef.fbclid) {
    sourceRef.sourcePlatform = 'facebook';
    sourceRef.sourceChannel = 'social';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (sourceRef.ttclid) {
    sourceRef.sourcePlatform = 'tiktok';
    sourceRef.sourceChannel = 'social';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (sourceRef.twclid) {
    sourceRef.sourcePlatform = 'x';
    sourceRef.sourceChannel = 'social';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (sourceRef.liFatId) {
    sourceRef.sourcePlatform = 'linkedin';
    sourceRef.sourceChannel = 'social';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (hasCampaignMarker) {
    sourceRef.sourcePlatform = 'other';
    sourceRef.sourceChannel = detectChannelFromUtmMedium(sourceRef.utmMedium) ?? 'campaign';
    sourceRef.sourceType = 'campaign';
    return;
  }

  if (!internal && refererHost) {
    const refererPlatform = detectPlatform(refererHost) || detectPlatform(sourceRef.httpRefer);
    sourceRef.sourcePlatform = refererPlatform ?? 'other';
    sourceRef.sourceChannel = detectChannelFromPlatform(refererPlatform) ?? 'referral';
    sourceRef.sourceType = 'referer';
    return;
  }

  sourceRef.sourcePlatform = 'direct';
  sourceRef.sourceChannel = 'direct';
  sourceRef.sourceType = 'direct';
}

// 提取用户首次访问来源
function extractSourceRef(request: NextRequest): SourceRefData | null {
  const headerRef = request.headers.get('referer') || request.headers.get('referrer');
  const customRef = request.headers.get('x-source-ref');
  const queryRef = request.nextUrl.searchParams.get('ref');
  const firstTouchRef = parseFirstTouchHeader(request);

  const sourceRef: SourceRefData = {
    ...parseUserAgent(request),
  };

  mergeSourceRef(sourceRef, firstTouchRef);

  sourceRef.landingUrl = sourceRef.landingUrl ?? normalizeSourceRef(request.nextUrl.toString()) ?? undefined;
  sourceRef.landingPath = sourceRef.landingPath ?? normalizeSourceRef(request.nextUrl.pathname) ?? undefined;
  sourceRef.landingHost = sourceRef.landingHost ?? normalizeHost(request.nextUrl.host) ?? undefined;
  sourceRef.ref = sourceRef.ref ?? normalizeQueryParam(queryRef) ?? undefined;

  let normalizedHttpRef: string | null = null;
  const candidates = [customRef, headerRef];
  for (const candidate of candidates) {
    const normalized = normalizeSourceRef(candidate);
    if (normalized) {
      normalizedHttpRef = normalized;
      sourceRef.httpRefer = sourceRef.httpRefer ?? normalized;
      break;
    }
  }

  const searchParams = request.nextUrl.searchParams;
  applySearchParams(sourceRef, searchParams);

  if (normalizedHttpRef) {
    try {
      const refererUrl = new URL(normalizedHttpRef);
      sourceRef.refererHost = sourceRef.refererHost ?? normalizeHost(refererUrl.host) ?? undefined;
      sourceRef.refererPath = sourceRef.refererPath ?? normalizeSourceRef(refererUrl.pathname) ?? undefined;
      sourceRef.refererDomain = sourceRef.refererDomain ?? getRootDomain(refererUrl.host) ?? undefined;
      applySearchParams(sourceRef, refererUrl.searchParams);
    } catch (error) {
      console.warn('Failed to parse referer url for utm/ref:', error);
    }
  }

  finalizeAttribution(sourceRef);

  return Object.keys(sourceRef).length > 0 ? sourceRef : null;
}


/**
 * 根据fingerprint_id查询用户并返回响应数据
 */
async function getUserByClerkId(clerkUserId: string): Promise<XUserResponse | null> {
  const entities = await fetchUserContextByClerkUserId(clerkUserId);
  if (!entities) {
    return null;
  }

  return createSuccessResponse({
    entities,
    isNewUser: false,
  });
}

/**
 * 根据fingerprint_id查询用户并返回响应数据
 */
async function getUserByFingerprintId(fingerprintId: string): Promise<XUserResponse | null> {
  const result = await fetchLatestUserContextByFingerprintId(fingerprintId);
  if (!result) {
    return null;
  }

  const { totalUsersOnDevice, hasAnonymousUser, ...entities } = result;

  return createSuccessResponse({
    entities,
    isNewUser: false,
    options: {
      totalUsersOnDevice,
      hasAnonymousUser,
    },
  });
}

/**
 * 通用的fingerprint处理逻辑
 */
async function handleFingerprintRequest(request: NextRequest, options: { createIfNotExists?: boolean; } = {}) {
  // 从请求中提取fingerprint ID
  const fingerprintId = extractFingerprintFromNextRequest(request);
  // 验证fingerprint ID
  if (!fingerprintId) {
    return createErrorResponse('Invalid or missing fingerprint ID');
  }
  console.log('Received fingerprintId:', fingerprintId);

  const { userId: clerkUserId } = await auth();
  try {
    // 优先根据 Clerk ID 查询（如果已登录）
    let existingUserResult: XUserResponse | null = null;
    if (clerkUserId) {
      // 已登录一律按照clerkUserId去查
      existingUserResult = await getUserByClerkId(clerkUserId);
      if (existingUserResult && existingUserResult.xUser.fingerprintId !== fingerprintId) {
        // 说明当前用户的指纹ID发生了改变，为什么呢？因为它使用同一账号去注册Clerk，Clerk判定是同一用户！
        // 这个时候一定以登录用户clerkUserId为准
        // 但是考虑到同一指纹ID本身可以绑定多个账号，所以这里什么都不做
        // 就是以当前登录用户去查他自己的数据就行！
        console.warn(`Current login user used diff fp_ids: ${clerkUserId}, db_fp_id=${existingUserResult.xUser.fingerprintId}, req_fp_id=${fingerprintId}`);
      }
    } else {
      // 其次才是检查是否已存在该fingerprint的用户
      existingUserResult = await getUserByFingerprintId(fingerprintId);
    }
    if (existingUserResult) {
      return NextResponse.json(existingUserResult);
    }

    // 如果不存在用户且不允许创建，返回404
    if (!options.createIfNotExists) {
      return createErrorResponse('User not found', 404);
    }

    const sourceRef = extractSourceRef(request);

    const anonymousInitResult = await anonymousAggregateService.getOrCreateByFingerprintId(
      fingerprintId,
      { sourceRef: sourceRef??  undefined}
    );

    if (anonymousInitResult.isNewUser) {
      console.log(`Created new anonymous user ${anonymousInitResult.user.userId} with fingerprint ${fingerprintId}`);
    }

    // 返回创建结果
    const response = createSuccessResponse({
      entities: {
        user: anonymousInitResult.user,
        credit: anonymousInitResult.credit,
        subscription: anonymousInitResult.subscription,
      },
      isNewUser: anonymousInitResult.isNewUser,
      options: {
        totalUsersOnDevice: anonymousInitResult.totalUsersOnDevice,
        hasAnonymousUser: anonymousInitResult.hasAnonymousUser,
      },
    });
    return NextResponse.json(response);

  } catch (error) {
    console.error('Fingerprint request error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

/**
 * 匿名用户初始化API
 * POST /api/user/anonymous/init
 */
export async function POST(request: NextRequest) {
  return handleFingerprintRequest(request, { createIfNotExists: true });
}
