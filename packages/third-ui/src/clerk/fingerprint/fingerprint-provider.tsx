'use client';

import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { themeButtonGradientClass, themeButtonGradientHoverClass, themeIconColor } from '@windrun-huaiin/base-ui/lib';
import { cn } from '@windrun-huaiin/lib/utils';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { FingerprintContextType, FingerprintProviderProps } from './types';
import { useFingerprint } from './use-fingerprint';
import { CopyableText } from '@windrun-huaiin/base-ui/ui';

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
    error 
  } = useFingerprintContext();

  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

  const creditBuckets = useMemo(() => {
    if (!xCredit) return [];
    return [
      {
        key: 'paid',
        label: '订阅积分',
        icon: <icons.Settings2 className="size-4 text-green-500 dark:text-green-300" />,
        balance: xCredit.balancePaid,
        total: xCredit.totalPaidLimit,
        start: xCredit.paidStart,
        end: xCredit.paidEnd,
      },
      {
        key: 'oneTimePaid',
        label: '一次性积分',
        icon: <icons.Coins className="size-4 text-amber-500 dark:text-amber-300" />,
        balance: xCredit.balanceOneTimePaid,
        total: xCredit.totalOneTimePaidLimit,
        start: xCredit.oneTimePaidStart,
        end: xCredit.oneTimePaidEnd,
      },
      {
        key: 'free',
        label: '免费积分',
        icon: <icons.Gift className="size-4 text-purple-500 dark:text-purple-300" />,
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
        status: '未订阅',
        priceName: '--',
        creditsAllocated: '--',
        period: '无记录',
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
          <icons.Lightbulb className="size-6 text-white" />
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
                  <icons.ShieldUser className="size-4" />
                  Fingerprint Debug Panel
                </div>
                <button
                  type="button"
                  aria-label="Close fingerprint panel"
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <icons.X className="size-4" />
                </button>
              </div>
            </header>

            <section className="space-y-1">
              {/* 用户信息 */}
              <PanelSection
                icon={<icons.Fingerprint className="size-4" />}
                title="用户信息"
                rightInfo={<StatusTag value={userStatus} />}
                items={[
                  { label: '用户ID', value: <CopyableText text={xUser?.userId || ''} /> },
                  { label: '用户昵称', value: <CopyableText text={xUser?.userName || ''} /> },
                  { label: 'FingerprintID', value: <CopyableText text={xUser?.fingerprintId || fingerprintId || ''} /> },
                  { label: 'Clerk用户', value: <CopyableText text={xUser?.clerkUserId || ''} /> },
                  { label: '邮箱', value: <CopyableText text={xUser?.email || ''} /> },
                  { label: 'Stripe客户', value: <CopyableText text={xUser?.stripeCusId || ''} /> },
                  { label: '创建时间', value: xUser?.createdAt || '--' },
                ]}
              />

              {/* 积分信息 */}
              <div className="space-y-2 rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-white/12 dark:bg-slate-900/50">
                <PanelHeader
                  icon={<icons.Gem className="size-4" />}
                  title="积分信息"
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
                    <EmptyPlaceholder label="暂无积分数据" icon={<icons.DatabaseZap className="size-4" />} />
                  )}
                </div>
              </div>

              {/* 订阅信息 */}
              <PanelSection
                icon={<icons.Bell className="size-4" />}
                title="订阅信息"
                rightInfo={<StatusTag value={subStatus} />}
                items={[
                  { label: '订阅方案', value: subscriptionStatus.priceName },
                  { label: '有效期', value: subscriptionStatus.period },
                  { label: '分配额度', value: subscriptionStatus.creditsAllocated },
                  { label: '订阅ID', value: <CopyableText text={xSubscription?.paySubscriptionId || ''} /> },
                  { label: 'OrderID', value: <CopyableText text={xSubscription?.orderId || ''} /> },
                  { label: 'Price ID', value: <CopyableText text={xSubscription?.priceId || ''} /> },
                ]}
              />

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-600 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <icons.X className="mt-0.5 size-4" />
                  <span>{error}</span>
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
    return '无记录';
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
