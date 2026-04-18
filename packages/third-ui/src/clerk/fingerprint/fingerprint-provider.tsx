'use client';

import {
  BellIcon,
  CoinsIcon,
  DatabaseZapIcon,
  FingerprintIcon,
  GemIcon,
  GiftIcon,
  LightbulbIcon,
  RefreshCcwIcon,
  Settings2Icon,
  ShieldUserIcon,
  XIcon,
} from '@windrun-huaiin/base-ui/icons';
import { themeButtonGradientClass, themeButtonGradientHoverClass, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FingerprintContextType, FingerprintProviderProps } from './types';
import { useFingerprint } from './use-fingerprint';
import { CopyableText } from '@windrun-huaiin/base-ui/ui';
import { createFingerprintHeaders } from './fingerprint-client';
import {
  getOrCreateDebugFingerprintOverride,
  regenerateDebugFingerprintOverride,
} from './fingerprint-debug';
import { FINGERPRINT_SOURCE_REFER } from './fingerprint-shared';

const FingerprintContext = createContext<FingerprintContextType | undefined>(undefined);

/**
 * Fingerprint Provider Component
 * 为应用提供fingerprint和匿名用户管理功能
 */
export function FingerprintProvider({ 
  children,
  config
}: FingerprintProviderProps) {
  const fingerprintData = useFingerprint(config);

  return (
    <FingerprintContext.Provider value={fingerprintData}>
      {children}
    </FingerprintContext.Provider>
  );
}

/**
 * Hook to use fingerprint context
 */
export function useFingerprintContext(): FingerprintContextType {
  const context = useContext(FingerprintContext);
  if (context === undefined) {
    throw new Error('useFingerprintContext must be used within a FingerprintProvider');
  }
  return context;
}

/**
 * Safe hook to use fingerprint context - returns null if no provider
 * 安全版本的fingerprint context hook - 如果没有Provider则返回null
 */
export function useFingerprintContextSafe(): FingerprintContextType | null {
  const context = useContext(FingerprintContext);
  return context || null;
}

/**
 * HOC for components that need fingerprint functionality
 * Note: This HOC now requires config to be passed externally
 */
export function withFingerprint<P extends object>(
  Component: React.ComponentType<P>,
  config: FingerprintProviderProps['config']
) {
  return function FingerprintWrappedComponent(props: P) {
    return (
      <FingerprintProvider config={config}>
        <Component {...props} />
      </FingerprintProvider>
    );
  };
}

/**
 * 组件：显示用户状态和积分信息（用于调试）
 */
export function FingerprintStatus() {
  const { 
    fingerprintId, 
    xUser, 
    xCredit, 
    xSubscription,
    error,
    clearError,
  } = useFingerprintContext();

  const [isOpen, setIsOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<'info' | 'test'>('info');
  const [testResult, setTestResult] = useState<string>('');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const isInitializingDebugAnonymousUserRef = useRef(false);
  const [activeDebugFingerprintId, setActiveDebugFingerprintId] = useState<string | null>(null);

  const handleToggle = () => setIsOpen(prev => !prev);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen]);

  useEffect(() => {
    if (xUser && !xUser.fingerprintId) {
      console.warn('xUser.fingerprintId is missing:', xUser);
    }
  }, [xUser]);

  useEffect(() => {
    if (panelMode !== 'test') {
      return;
    }

    setActiveDebugFingerprintId((current) => current ?? getOrCreateDebugFingerprintOverride());
  }, [panelMode]);

  const creditBuckets = useMemo(() => {
    if (!xCredit) return [];
    return [
      {
        key: 'paid',
        label: 'Paid',
        icon: <Settings2Icon className="size-4 text-green-500 dark:text-green-300" />,
        balance: xCredit.balancePaid,
        total: xCredit.totalPaidLimit,
        start: xCredit.paidStart,
        end: xCredit.paidEnd,
      },
      {
        key: 'oneTimePaid',
        label: 'OneTimePaid',
        icon: <CoinsIcon className="size-4 text-amber-500 dark:text-amber-300" />,
        balance: xCredit.balanceOneTimePaid,
        total: xCredit.totalOneTimePaidLimit,
        start: xCredit.oneTimePaidStart,
        end: xCredit.oneTimePaidEnd,
      },
      {
        key: 'free',
        label: 'Free',
        icon: <GiftIcon className="size-4 text-purple-500 dark:text-purple-300" />,
        balance: xCredit.balanceFree,
        total: xCredit.totalFreeLimit,
        start: xCredit.freeStart,
        end: xCredit.freeEnd,
      },
    ];
  }, [xCredit]);

  const subscriptionStatus = useMemo(() => {
    if (!xSubscription) {
      return {
        status: 'Never',
        priceName: '--',
        creditsAllocated: '--',
        period: 'Unavailable',
      };
    }
    return {
      status: xSubscription.status ?? '--',
      priceName: xSubscription.priceName ?? '--',
      creditsAllocated: typeof xSubscription.creditsAllocated === 'number'
        ? formatNumber(xSubscription.creditsAllocated)
        : '--',
      period: formatRangeText(xSubscription.subPeriodStart, xSubscription.subPeriodEnd),
    };
  }, [xSubscription]);

  const userStatus = xUser?.status || '--';
  const totalCredits = formatNumber(xCredit?.totalBalance);
  const subStatus = subscriptionStatus.status;
  const themedGhostButtonClass = cn(
    'border-slate-200 bg-white/90 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/80 dark:hover:bg-slate-900',
    'hover:border-current',
    themeIconColor
  );

  const runContextParallelInitTest = async () => {
    const debugFingerprintId = activeDebugFingerprintId ?? getOrCreateDebugFingerprintOverride();
    if (!debugFingerprintId) {
      setTestResult('Test fingerprint override is not ready yet.');
      return;
    }

    setActiveDebugFingerprintId(debugFingerprintId);
    setIsRunningTest(true);
    setTestResult(`Running Frontend Prevention Test with fingerprint: ${debugFingerprintId}`);

    try {
      await Promise.all([
        initializeDebugAnonymousUser(debugFingerprintId),
        initializeDebugAnonymousUser(debugFingerprintId),
        initializeDebugAnonymousUser(debugFingerprintId),
      ]);
      setTestResult(`Frontend Prevention Test finished. Active test fingerprint: ${debugFingerprintId}`);
    } catch (testError) {
      setTestResult(`Frontend Prevention Test failed: ${formatErrorMessage(testError)}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const initializeDebugAnonymousUser = async (debugFingerprintId: string) => {
    if (isInitializingDebugAnonymousUserRef.current) {
      return;
    }

    try {
      isInitializingDebugAnonymousUserRef.current = true;

      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch('/api/user/anonymous/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [FINGERPRINT_SOURCE_REFER]: document.referrer || '',
          ...fingerprintHeaders,
          'x-fingerprint-id-v8': debugFingerprintId,
        },
        body: JSON.stringify({ fingerprintId: debugFingerprintId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize anonymous user');
      }

      await response.json().catch(() => ({}));
    } finally {
      isInitializingDebugAnonymousUserRef.current = false;
    }
  };

  const runRawParallelPostTest = async () => {
    const normalizedFingerprintId = activeDebugFingerprintId ?? getOrCreateDebugFingerprintOverride();
    if (!normalizedFingerprintId) {
      setTestResult('Test fingerprint override is not ready yet.');
      return;
    }

    setActiveDebugFingerprintId(normalizedFingerprintId);
    setIsRunningTest(true);
    setTestResult(`Running Backend Idempotency Test with fingerprint: ${normalizedFingerprintId}`);

    try {
      const fingerprintHeaders = await createFingerprintHeaders();
      const requests = Array.from({ length: 3 }, () => fetch('/api/user/anonymous/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [FINGERPRINT_SOURCE_REFER]: document.referrer || '',
          ...fingerprintHeaders,
          'x-fingerprint-id-v8': normalizedFingerprintId,
        },
        body: JSON.stringify({ fingerprintId: normalizedFingerprintId }),
      }));

      const responses = await Promise.all(requests);
      const payloads = await Promise.all(responses.map(async (response) => {
        const data = await response.json().catch(() => ({}));
        return {
          ok: response.ok,
          status: response.status,
          isNewUser: typeof data?.isNewUser === 'boolean' ? data.isNewUser : null,
          userId: typeof data?.xUser?.userId === 'string' ? data.xUser.userId : '--',
          fingerprintId: typeof data?.xUser?.fingerprintId === 'string' ? data.xUser.fingerprintId : normalizedFingerprintId,
          error: typeof data?.error === 'string' ? data.error : null,
        };
      }));

      const createdUserIds = payloads
        .filter((payload) => payload.ok && payload.isNewUser === true && payload.userId !== '--')
        .map((payload) => payload.userId);
      const reusedUserIds = payloads
        .filter((payload) => payload.ok && payload.isNewUser === false && payload.userId !== '--')
        .map((payload) => payload.userId);
      const failedStatuses = payloads
        .filter((payload) => !payload.ok)
        .map((payload) => `${payload.status}${payload.error ? `:${payload.error}` : ''}`);

      setTestResult(
        [
          `Backend Idempotency Test done.`,
          `created=${createdUserIds.length}`,
          `reused=${reusedUserIds.length}`,
          `failed=${failedStatuses.length}`,
          `createdUserIds=[${createdUserIds.join(', ')}]`,
          failedStatuses.length > 0 ? `failedStatuses=[${failedStatuses.join(', ')}]` : null,
        ].filter(Boolean).join('\n')
      );
    } catch (testError) {
      setTestResult(`Backend Idempotency Test failed: ${formatErrorMessage(testError)}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  const regenerateTestFingerprint = () => {
    const nextFingerprintId = regenerateDebugFingerprintOverride();
    setActiveDebugFingerprintId(nextFingerprintId);
    setTestResult(`Generated test fingerprint override: ${nextFingerprintId}`);
  };

  return (
    <>
      {/* 灯泡按钮 */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          type="button"
          aria-label="Fingerprint debug panel"
        className={cn(
          'fixed left-2 top-2 md:left-2 md:top-3 z-10000 inline-flex size-8 md:size-11 items-center justify-center rounded-full',
          themeButtonGradientClass,
          themeButtonGradientHoverClass,
          'text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
        )}
      >
          <LightbulbIcon className="size-6 text-white" />
        </button>
      )}

      {/* 面板 */}
      {isOpen && (
        <>
          <div onClick={handleBackdropClick} className="fixed inset-0 z-9998 bg-black/60 backdrop-blur-sm" />
          <div
            ref={modalRef}
            className={cn(
              'fixed inset-3 z-9999 mx-auto w-[min(95vw,520px)] overflow-y-auto rounded-2xl border',
              'border-slate-200/70 bg-white/95 p-4 shadow-2xl backdrop-blur-sm',
              'font-sans text-sm text-slate-700 dark:border-white/12 dark:bg-slate-950/95 dark:text-slate-200',
              'sm:inset-auto md:left-2 sm:top-1 md:right-auto sm:w-[min(520px,95vw)] sm:p-5'
            )}
          >
            <header className="mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex items-center gap-2 text-base font-bold tracking-wider", themeIconColor)}>
                  <ShieldUserIcon className="size-4" />
                  Fingerprint Debug Panel
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelMode((prev) => prev === 'info' ? 'test' : 'info')}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-semibold shadow-sm transition-all duration-200',
                      panelMode === 'test'
                        ? cn('border-transparent text-white', themeButtonGradientClass, themeButtonGradientHoverClass)
                        : themedGhostButtonClass
                    )}
                    aria-pressed={panelMode === 'test'}
                  >
                    <span>Concurrent Test</span>
                    <span
                      className={cn(
                        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                        panelMode === 'test'
                          ? 'bg-white/25'
                          : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block size-4 rounded-full shadow-sm transition-transform',
                          panelMode === 'test' ? 'bg-white' : 'bg-white dark:bg-slate-100',
                          panelMode === 'test' ? 'translate-x-4' : 'translate-x-0.5'
                        )}
                      />
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label="Close fingerprint panel"
                    className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              </div>
            </header>

            <section className="space-y-1">
              {panelMode === 'info' ? (
                <>
                  <PanelSection
                    icon={<FingerprintIcon className="size-4" />}
                    title="User"
                    rightInfo={<StatusTag value={userStatus} />}
                    items={[
                      { label: 'UserID', value: <CopyableText text={xUser?.userId || ''} /> },
                      { label: 'NickName', value: <CopyableText text={xUser?.userName || ''} /> },
                      { label: 'FingerprintID', value: <CopyableText text={xUser?.fingerprintId || fingerprintId || ''} /> },
                      { label: 'ClerkUserID', value: <CopyableText text={xUser?.clerkUserId || ''} /> },
                      { label: 'Email', value: <CopyableText text={xUser?.email || ''} /> },
                      { label: 'StripeCusID', value: <CopyableText text={xUser?.stripeCusId || ''} /> },
                      { label: 'CreatedAt', value: xUser?.createdAt || '--' },
                    ]}
                  />

                  <div className="space-y-2 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/12 dark:bg-slate-900/50">
                    <PanelHeader
                      icon={<GemIcon className="size-4" />}
                      title="Credits Info"
                      rightInfo={<span className={cn("font-semibold", themeIconColor)}>{totalCredits}</span>}
                    />
                    <div className="space-y-3">
                      {creditBuckets.length > 0 ? (
                        creditBuckets.map((bucket) => {
                          const percent = Math.round(computeProgress(bucket.balance, bucket.total) * 100);
                          return (
                            <div key={bucket.key} className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-slate-900/40">
                              <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-1.5">
                                  {bucket.icon}
                                  <span>{bucket.label}</span>
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-100">
                                  {formatNumber(bucket.balance)} / {formatNumber(bucket.total)}
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-linear-to-r from-purple-500 via-pink-500 to-rose-400 transition-[width]"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                <span>{formatRangeText(bucket.start, bucket.end)}</span>
                                <span>{percent}%</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <EmptyPlaceholder label="No Credits Yet" icon={<DatabaseZapIcon className="size-4" />} />
                      )}
                    </div>
                  </div>

                  <PanelSection
                    icon={<BellIcon className="size-4" />}
                    title="Subscription"
                    rightInfo={<StatusTag value={subStatus} />}
                    items={[
                      { label: 'Plan', value: subscriptionStatus.priceName },
                      { label: 'Period', value: subscriptionStatus.period },
                      { label: 'Allocated', value: subscriptionStatus.creditsAllocated },
                      { label: 'SubID', value: <CopyableText text={xSubscription?.paySubscriptionId || ''} /> },
                      { label: 'OrderID', value: <CopyableText text={xSubscription?.orderId || ''} /> },
                      { label: 'PriceID', value: <CopyableText text={xSubscription?.priceId || ''} /> },
                    ]}
                  />
                </>
              ) : (
                <div className="space-y-3 rounded-xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-white/12 dark:bg-slate-900/45">
                  <PanelHeader
                    icon={<DatabaseZapIcon className="size-4" />}
                    title="Concurrent Base Info"
                    rightInfo={<StatusTag value={isRunningTest ? 'pending' : 'idle'} />}
                  />

                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400 dark:text-slate-500">Real Browser</span>
                      <CopyableText text={fingerprintId || ''} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 dark:text-slate-500">Test Override</span>
                      <div className="flex items-center gap-2 py-1">
                        <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-[0.5rem] sm:text-[0.625rem] md:text-xs leading-tight text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100">
                          <CopyableText text={activeDebugFingerprintId || ''} />
                        </div>
                        <button
                          type="button"
                          disabled={isRunningTest}
                          onClick={regenerateTestFingerprint}
                          aria-label="Generate new test fingerprint"
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                        >
                          <RefreshCcwIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={isRunningTest}
                      onClick={runContextParallelInitTest}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                        themedGhostButtonClass
                      )}
                    >
                      Frontend Prevention Test
                    </button>
                    <button
                      type="button"
                      disabled={isRunningTest}
                      onClick={runRawParallelPostTest}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                        'border-transparent',
                        themeButtonGradientClass,
                        themeButtonGradientHoverClass
                      )}
                    >
                      Backend Idempotency Test
                    </button>
                  </div>

                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-slate-950/50">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                      {testResult || 'No test executed yet.'}
                    </pre>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-600 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <XIcon className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button
                    type="button"
                    aria-label="Dismiss error"
                    onClick={clearError}
                    className="shrink-0 rounded-full p-1 text-amber-500 transition hover:bg-amber-100 hover:text-amber-700 dark:text-amber-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-100"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}


/* ==================== 新增辅助组件 ==================== */

// 标题行：左侧图标+标题，右侧信息（右对齐）
function PanelHeader({ icon, title, rightInfo }: { icon: React.ReactNode; title: string; rightInfo: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
        <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </span>
        <span className={cn("rounded-full bg-purple-100 px-2 py-1 text-xs font-bold", themeIconColor)}>
          {title}
        </span>
      </div>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
        {rightInfo}
      </span>
    </div>
  );
}

// 复用：普通 PanelSection 支持右侧信息
interface PanelSectionProps {
  icon: React.ReactNode;
  title: string;
  rightInfo?: React.ReactNode;
  items: Array<{ label: string; value: React.ReactNode }>;
}

function PanelSection({ icon, title, rightInfo, items }: PanelSectionProps) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-white/12 dark:bg-slate-900/45">
      <PanelHeader icon={icon} title={title} rightInfo={rightInfo} />
      <dl className="grid grid-cols-1 gap-y-1.5 text-xs text-slate-500 dark:text-slate-300">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <dt className="text-slate-400 dark:text-slate-500">{item.label}</dt>
            <dd className="text-right font-medium text-slate-600 dark:text-slate-100">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EmptyPlaceholder({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-6 text-xs text-slate-400 dark:border-white/10 dark:bg-slate-900/30 dark:text-slate-500">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

function computeProgress(balance: number | null | undefined, total: number | null | undefined) {
  if (typeof balance !== 'number' || typeof total !== 'number' || Number.isNaN(balance) || Number.isNaN(total) || total <= 0) {
    return 0;
  }
  const ratio = balance / total;
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(Math.max(ratio, 0), 1);
}

function formatRangeText(start: string | null | undefined, end: string | null | undefined) {
  const safeStart = start && start.trim() ? start : '';
  const safeEnd = end && end.trim() ? end : '';

  if (!safeStart && !safeEnd) {
    return 'No records';
  }

  if (!safeStart) {
    return safeEnd;
  }

  if (!safeEnd) {
    return safeStart;
  }

  return `${safeStart} - ${safeEnd}`;
}

function StatusTag({ value }: { value: string | undefined | null }) {
  if (!value) return <span className="text-slate-400">None</span>;

  const normalized = value.toLowerCase();

  const colorMap: Record<string, string> = {
    // 绿色：正常/活跃
    registered: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    trialing: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',

    // 灰色：失效/删除
    canceled: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    frozen: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    deleted: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
    past_due: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',

    // 橙色：待处理/异常
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    failed: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    incomplete: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  };

  const defaultColor = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  const badgeClass = colorMap[normalized] || defaultColor;

  return (
    <span className={cn(
      'inline-block rounded-full px-2 py-0.5 text-xs capitalize font-medium',
      badgeClass
    )}>
      {value}
    </span>
  );
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}
