'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { CreditNavButton } from './credit-nav-button';
import { CreditOverviewClient, type CreditOverviewTranslations } from './credit-overview-client';
import type { CreditOverviewData } from './types';

export interface CreditOverviewPayload {
  data: CreditOverviewData;
  totalLabel: string;
  translations: CreditOverviewTranslations;
}

export interface CreditOverviewNavClientProps {
  locale: string;
  endpoint: string;
}

function buildCreditOverviewUrl(endpoint: string, locale: string) {
  const url = new URL(endpoint, window.location.origin);
  url.searchParams.set('locale', locale);
  return url.toString();
}

export function CreditOverviewNavClient({
  locale,
  endpoint,
}: CreditOverviewNavClientProps) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [payload, setPayload] = useState<CreditOverviewPayload | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setPayload(null);
      return;
    }

    const controller = new AbortController();

    async function loadCreditOverview() {
      try {
        const response = await fetch(buildCreditOverviewUrl(endpoint, locale), {
          credentials: 'same-origin',
          signal: controller.signal,
        });

        if (!response.ok) {
          if (!controller.signal.aborted) {
            setPayload(null);
          }
          return;
        }

        const nextPayload = (await response.json()) as CreditOverviewPayload | null;
        if (!controller.signal.aborted) {
          setPayload(nextPayload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPayload(null);
          console.warn('[CreditOverviewNavClient] Failed to load credit overview', error);
        }
      }
    }

    loadCreditOverview();

    return () => {
      controller.abort();
    };
  }, [endpoint, isLoaded, isSignedIn, locale, userId]);

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
