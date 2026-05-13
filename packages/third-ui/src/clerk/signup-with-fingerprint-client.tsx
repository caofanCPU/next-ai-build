'use client';

import { SignUp } from '@clerk/nextjs';
import { useEffect } from 'react';
import { clerkAuthPageAppearance } from './clerk-auth-appearance';
import { useFingerprintContextSafe } from './fingerprint/fingerprint-provider';

/**
 * SignUp component with fingerprint awareness
 * Falls back to the standard SignUp component when FingerprintProvider is absent.
 * Handles fingerprint-related metadata when FingerprintProvider is available.
 */
export function SignUpWithFingerprint() {
  const fingerprintContext = useFingerprintContextSafe();
  
  // Use defaults when fingerprint context is unavailable.
  const { 
    fingerprintId = null, 
    xUser = null, 
    isInitialized = false,
    initializeAnonymousUser = async () => {}
  } = fingerprintContext || {};

  // Prepare Clerk metadata with anonymous user information.
  const unsafeMetadata = {
    user_id: xUser?.userId || null,
    fingerprint_id: fingerprintId || null,
  };

  // Ensure the anonymous user has been initialized.
  useEffect(() => {
    if (!isInitialized && fingerprintId) {
      initializeAnonymousUser();
    }
  }, [fingerprintId, isInitialized, initializeAnonymousUser]);

  return <SignUp appearance={clerkAuthPageAppearance} unsafeMetadata={unsafeMetadata} />;
}
