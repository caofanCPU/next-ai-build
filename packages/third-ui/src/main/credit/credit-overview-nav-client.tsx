'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CreditNavButton } from './credit-nav-button';
import { CreditOverviewClient, type CreditOverviewTranslations } from './credit-overview-client';
import type { CreditOverviewData } from './types';

export const DEFAULT_CREDIT_OVERVIEW_REFRESH_EVENT = 'windrun-huaiin:credit-overview:refresh';

export interface CreditOverviewPayload {
  data: CreditOverviewData;
  totalLabel: string;
  translations: CreditOverviewTranslations;
}

export interface CreditOverviewNavClientProps {
  locale: string;
  endpoint: string;
  /**
   * Browser event names that should trigger credit overview reload.
   * Business apps can dispatch these events after credit balance changes.
   *
   * Default: ['windrun:credit-overview:refresh']
   * Empty array means event listening is disabled.
   */
  refreshEvents?: string[];
  /**
   * Optional debounce for refresh event bursts.
   * Default: 300ms.
   */
  refreshDebounceMs?: number;
}

function buildCreditOverviewUrl(endpoint: string, locale: string) {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('locale', locale);
  return url.toString();
}

function normalizeRefreshEvents(refreshEvents: string[] | undefined) {
  const events = refreshEvents ?? [DEFAULT_CREDIT_OVERVIEW_REFRESH_EVENT];
  return Array.from(
    new Set(
      events
        .map((eventName) => eventName.trim())
        .filter((eventName) => eventName.length > 0),
    ),
  );
}

function buildRefreshEventsKey(refreshEvents: string[] | undefined) {
  return normalizeRefreshEvents(refreshEvents).join('\n');
}

export function dispatchCreditOverviewRefresh(
  eventName = DEFAULT_CREDIT_OVERVIEW_REFRESH_EVENT,
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(eventName));
}

export function CreditOverviewNavClient({
  locale,
  endpoint,
  refreshEvents,
  refreshDebounceMs = 300,
}: CreditOverviewNavClientProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [payload, setPayload] = useState<CreditOverviewPayload | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);
  const refreshEventsKey = buildRefreshEventsKey(refreshEvents);
  const normalizedRefreshEvents = useMemo(
    () => refreshEventsKey.split('\n').filter(Boolean),
    [refreshEventsKey],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadCreditOverview = useCallback(async () => {
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(buildCreditOverviewUrl(endpoint, locale), {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      });

      if (!response.ok) {
        if (!controller.signal.aborted && isMountedRef.current) {
          setPayload(null);
        }
        return;
      }

      const nextPayload = (await response.json()) as CreditOverviewPayload | null;
      if (!controller.signal.aborted && isMountedRef.current) {
        setPayload(nextPayload);
      }
    } catch (error) {
      if (!controller.signal.aborted && isMountedRef.current) {
        setPayload(null);
        console.warn('[CreditOverviewNavClient] Failed to load credit overview', error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [endpoint, locale]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setPayload(null);
      return;
    }

    void loadCreditOverview();
  }, [isLoaded, isSignedIn, loadCreditOverview, userId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || normalizedRefreshEvents.length === 0) {
      return;
    }

    let debounceTimer: number | null = null;

    const refresh = () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }

      debounceTimer = window.setTimeout(() => {
        void loadCreditOverview();
      }, refreshDebounceMs);
    };

    for (const eventName of normalizedRefreshEvents) {
      window.addEventListener(eventName, refresh);
    }

    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }

      for (const eventName of normalizedRefreshEvents) {
        window.removeEventListener(eventName, refresh);
      }
    };
  }, [isLoaded, isSignedIn, loadCreditOverview, normalizedRefreshEvents, refreshDebounceMs]);

  if (!payload) {
    return null;
  }

  return (
    <CreditNavButton
      locale={locale}
      totalBalance={payload.data.totalBalance}
      totalLabel={payload.totalLabel}
    >
      <CreditOverviewClient
        locale={locale}
        data={payload.data}
        translations={payload.translations}
      />
    </CreditNavButton>
  );
}
