'use client';

import { CreditNavButton, CreditOverviewClient } from '@third-ui/main';
import type { CreditOverviewData, CreditOverviewTranslations } from '@third-ui/main';
import { useEffect, useState } from 'react';

interface CreditPopoverClientProps {
  locale: string;
}

interface CreditOverviewPayload {
  data: CreditOverviewData;
  totalLabel: string;
  translations: CreditOverviewTranslations;
}

export function CreditPopoverClient({ locale }: CreditPopoverClientProps) {
  const [payload, setPayload] = useState<CreditOverviewPayload | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCreditOverview() {
      try {
        const response = await fetch(
          `/api/user/credit-overview?locale=${encodeURIComponent(locale)}`,
          {
            credentials: 'same-origin',
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const nextPayload = (await response.json()) as CreditOverviewPayload | null;
        if (!controller.signal.aborted) {
          setPayload(nextPayload);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('[CreditPopover] Failed to load credit overview', error);
        }
      }
    }

    loadCreditOverview();

    return () => {
      controller.abort();
    };
  }, [locale]);

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
