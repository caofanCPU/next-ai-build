'use client';

import { clerkIntl } from '@third-ui/lib/clerk-intl';
import { ClerkProvider } from '@clerk/nextjs';
import React from 'react';

interface ClerkProviderClientProps {
  children: React.ReactNode;
  locale: string;
  // Whether localePrefix is set to 'as-needed' (default: true)
  localePrefixAsNeeded?: boolean;
  // The default locale used by the host app (default: 'en')
  defaultLocale?: string;
  signInUrl?: string;
  signUpUrl?: string;
  fallbackSignInUrl?: string;
  fallbackSignUpUrl?: string;
  waitlistUrl?: string;
}

export function ClerkProviderClient({
  children,
  locale,
  localePrefixAsNeeded = true,
  defaultLocale = 'en',
  signInUrl,
  signUpUrl,
  fallbackSignInUrl,
  fallbackSignUpUrl,
  waitlistUrl,
}: ClerkProviderClientProps) {
  const currentLocalization =
    clerkIntl[locale as keyof typeof clerkIntl] ??
    clerkIntl[defaultLocale as keyof typeof clerkIntl] ??
    clerkIntl.en;

  // In as-needed mode, skip prefixing for the default locale so /sign-in stays unprefixed.
  const shouldPrefixLocale = localePrefixAsNeeded ? locale !== defaultLocale : true;
  const localeSegment = shouldPrefixLocale && locale ? `/${locale}` : '';

  const buildUrl = (path?: string) =>
    path ? `${localeSegment}${path}` : undefined;

  // build the ClerkProvider props, only add when the parameter is not empty
  const clerkProviderProps: Record<string, any> = {
    localization: currentLocalization,
  };

  // Only add URL when the parameter is not empty
  const signInWithLocale = buildUrl(signInUrl);
  if (signInWithLocale) {
    clerkProviderProps.signInUrl = signInWithLocale;
  }

  const signUpWithLocale = buildUrl(signUpUrl);
  if (signUpWithLocale) {
    clerkProviderProps.signUpUrl = signUpWithLocale;
  }

  const signInFallbackWithLocale = buildUrl(fallbackSignInUrl);
  if (signInFallbackWithLocale) {
    clerkProviderProps.signInFallbackRedirectUrl = signInFallbackWithLocale;
  }

  const signUpFallbackWithLocale = buildUrl(fallbackSignUpUrl);
  if (signUpFallbackWithLocale) {
    clerkProviderProps.signUpFallbackRedirectUrl = signUpFallbackWithLocale;
  }

  const waitlistWithLocale = buildUrl(waitlistUrl);
  if (waitlistWithLocale) {
    clerkProviderProps.waitlistUrl = waitlistWithLocale;
  }

  // console.log('ClerkProviderClient props:', clerkProviderProps);

  return (
    <ClerkProvider {...clerkProviderProps}>
      {children}
    </ClerkProvider>
  );
} 
