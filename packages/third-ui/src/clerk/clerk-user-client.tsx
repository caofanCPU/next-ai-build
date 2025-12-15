'use client';

import { useState } from 'react';
import { ClerkLoaded, ClerkLoading, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import { SignUpButtonWithFingerprint } from './signup-button-with-fingerprint-client';

interface ClerkUserData {
  signIn: string;
  signUp: string;
  signUpBonus?: string;
  signUpBonusTooltip?: string;
  terms: string;
  privacy: string;
  locale: string;
  clerkAuthInModal: boolean;
  showSignUp: boolean;
}

export function ClerkUserClient({ data }: { data: ClerkUserData }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex items-center gap-2 h-10 mr-3 sm:mr-2">
      <ClerkLoading>
          <div className="w-20 h-9 px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-sm"></div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignedOut>
          {data.showSignUp && (
            <div className="relative inline-flex z-10">
              <SignUpButtonWithFingerprint mode={data.clerkAuthInModal ? 'modal' : 'redirect'} signUp={data.signUp}/>
              {data.signUpBonus && (
                <>
                  <span
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="absolute -top-0.5 sm:-top-1 -right-1.5 sm:-right-2 flex h-4 sm:h-5 min-w-4 sm:min-w-5 items-center justify-center rounded-full bg-linear-to-r from-purple-400 to-pink-500 dark:from-purple-500 dark:to-pink-600 px-1 sm:px-1.5 text-[9px] sm:text-[10px] font-bold text-white shadow-lg shadow-purple-500/30 ring-1 sm:ring-2 ring-white/80 dark:ring-white/10 cursor-default"
                  >
                    {data.signUpBonus}
                  </span>
                  {showTooltip && data.signUpBonusTooltip && (
                    <div className="absolute left-1/2 -translate-x-1/2 -translate-y-full -top-1.5 whitespace-nowrap rounded-lg bg-linear-to-r from-purple-500 to-pink-500 dark:from-purple-500 dark:to-pink-600 border border-white/30 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-purple-500/30 pointer-events-none">
                      {data.signUpBonusTooltip}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <SignInButton mode={data.clerkAuthInModal ? 'modal' : 'redirect'}>
            <button className="w-16 sm:w-20 h-8 sm:h-9 px-1.5 sm:px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-xs sm:text-sm whitespace-nowrap">
              {data.signIn}
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "w-8 h-8 border",
              }
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action label="manageAccount" />
              {<UserButton.Link
                labelIcon={<icons.ReceiptText className="size-4 fill-none stroke-(--clerk-icon-stroke-color)" />}
                label={data.terms}
                href={`/${data.locale}/legal/terms`}>
              </UserButton.Link>}
              {<UserButton.Link
                labelIcon={<icons.ShieldUser className="size-4 fill-none stroke-(--clerk-icon-stroke-color)" />}
                label={data.privacy}
                href={`/${data.locale}/legal/privacy`}>
              </UserButton.Link>}
              <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
          </UserButton>
        </SignedIn>
      </ClerkLoaded>
    </div>
  );
}
