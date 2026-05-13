'use client';

import { SignUpButton, useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { clerkAuthModalAppearance } from './clerk-auth-appearance';
import { useFingerprintContextSafe } from './fingerprint/fingerprint-provider';

interface SignUpButtonWithFingerprintProps {
  mode: 'modal' | 'redirect',
  signUp: string;
}

export function SignUpButtonWithFingerprint({
  mode,
  signUp,
}: SignUpButtonWithFingerprintProps) {
  if (mode === 'redirect') {
    return (
      // Redirect mode navigates directly to the custom sign-up page.
      <SignUpButton>
        <button 
          className="w-16 sm:w-20 h-8 sm:h-9 px-1.5 sm:px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-xs sm:text-sm whitespace-nowrap"
        >
          {signUp}
        </button>
      </SignUpButton>
    )
  }

  // Modal mode requires a custom sign-up button.
  const fingerprintContext = useFingerprintContextSafe();

  // Use defaults when fingerprint context is unavailable.
  const { 
    fingerprintId = null, 
    xUser = null, 
    isInitialized = false,
    initializeAnonymousUser = async () => {}
  } = fingerprintContext || {};

  const userId = xUser?.userId || null;
  const unsafeMetadata = {
    user_id: userId,
    fingerprint_id: fingerprintId || null,
  };

  // Ensure the anonymous user has been initialized.
  useEffect(() => {
    if (!isInitialized && fingerprintId) {
      initializeAnonymousUser();
    }
  }, [fingerprintId, isInitialized, initializeAnonymousUser]);

  const { openSignUp } = useClerk();
  

  const handleClick = () => {
    openSignUp({
      appearance: clerkAuthModalAppearance,
      unsafeMetadata,
    });
  };

  return (
    <button 
      className="w-16 sm:w-20 h-8 sm:h-9 px-1.5 sm:px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-xs sm:text-sm whitespace-nowrap"
      onClick={handleClick}
    >
      {signUp}
    </button>
    );
}
