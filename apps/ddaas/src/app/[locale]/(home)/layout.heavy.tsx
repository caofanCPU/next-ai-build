import { CreditPopoverClient } from '@/components/credit-popover-client';
import { appConfig } from '@/lib/appConfig';
import { ClerkUser } from '@third-ui/clerk/server';
import type { SiteNavItemConfig } from '@third-ui/fuma/base/site-layout-shared';

export async function homeHeavyItems(locale: string): Promise<SiteNavItemConfig[]> {
  return [
    {
      type: 'custom',
      secondary: true,
      mobilePinned: true,
      children: <CreditPopoverClient locale={locale} />,
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
