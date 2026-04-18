'use client';

import { OrganizationSwitcher } from '@clerk/nextjs';
import { D8Icon, ReceiptTextIcon, ShieldUserIcon } from '@windrun-huaiin/base-ui/icons';

interface ClerkOrganizationData {
  homepage: string;
  terms: string;
  privacy: string;
  locale: string;
  className: string;
}

export function ClerkOrganizationClient({ data }: { data: ClerkOrganizationData }) {
  return (
    <div className={` ms-3 me-2 flex items-center h-10 rounded-full border shadow-lg ${data.className}`}>
      <div className="flex items-center gap-x-4 w-full min-w-40">
        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger:
                "w-40 h-10 border !rounded-full bg-transparent flex items-center justify-between box-border",
              organizationSwitcherTriggerIcon: "",
              userButtonAvatarBox: "w-8 h-8 border rounded-full",
            },
          }}
        >
          <OrganizationSwitcher.OrganizationProfilePage
            label={data.homepage}
            url="/"
            labelIcon={<D8Icon />}
          />
          <OrganizationSwitcher.OrganizationProfilePage 
            labelIcon={<ReceiptTextIcon />}
            label={data.terms}
            url={`/${data.locale}/legal/terms`}
          >
          </OrganizationSwitcher.OrganizationProfilePage>

          <OrganizationSwitcher.OrganizationProfilePage
            labelIcon={<ShieldUserIcon />}
            label={data.privacy}
            url={`/${data.locale}/legal/privacy`}
          >
          </OrganizationSwitcher.OrganizationProfilePage> 
        </OrganizationSwitcher>
      </div>
    </div>
  );
}
