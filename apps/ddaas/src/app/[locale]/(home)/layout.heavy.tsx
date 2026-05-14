import { appConfig } from '@/lib/appConfig';
import { ClerkUser } from '@third-ui/clerk/server';
import type { SiteNavItemConfig } from '@third-ui/fuma/base/site-layout-shared';
import { CreditOverviewNavClient } from '@third-ui/main/credit';

export async function homeHeavyItems(locale: string): Promise<SiteNavItemConfig[]> {
  return [
    {
      type: 'custom',
      secondary: true,
      mobilePinned: true,
      children: (
        <CreditOverviewNavClient
          locale={locale}
          endpoint="/api/user/credit-overview"
        />
      ),
    },
    {
      type: 'custom',
      secondary: true,
      mobilePinned: true,
      children: (
        <ClerkUser
          locale={locale}
          clerkAuthInModal={appConfig.style.clerkAuthInModal}
          showSignUp={true}
        />
      ),
    },
  ];
}
