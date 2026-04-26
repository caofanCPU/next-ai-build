import { CreditPopover } from '@/components/credit-popover';
import { appConfig } from '@/lib/appConfig';
import { ClerkUser } from '@third-ui/clerk/server';
import type { SiteNavItemConfig } from '@third-ui/fuma/base';

export async function homeHeavyItems(locale: string): Promise<SiteNavItemConfig[]> {
  return [
    {
      type: 'custom',
      secondary: true,
      mobilePinned: true,
      children: <CreditPopover locale={locale} />,
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
