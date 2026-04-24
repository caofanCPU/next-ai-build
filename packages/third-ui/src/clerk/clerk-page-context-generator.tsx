'use client';

/**
 * Client-side page generators with fingerprint support
 * These should only be used in client-side code
 */

import { SignUpWithFingerprint } from './signup-with-fingerprint-client';
import { SignInWithFingerprint } from './signin-with-fingerprint-client';

const clerkPageContainerClassName =
  'flex min-h-dvh w-full items-start justify-center px-6 pt-[calc(var(--fd-banner-height,0px)+var(--fd-header-height,3.5rem)+1rem)] pb-6 md:px-8 md:pt-[calc(var(--fd-banner-height,0px)+var(--fd-header-height,3.5rem)+1.5rem)] md:pb-8';

/**
 * Create a SignUp page with fingerprint support
 * Note: This must be used within a FingerprintProvider
 */
export function createSignUpPageWithFingerprint() {
  return function SignUpPage() {
    return (
      <div className={clerkPageContainerClassName}>
        <SignUpWithFingerprint />
      </div>
    );
  };
}

/**
 * Create a SignIn page with fingerprint support
 * Note: This must be used within a FingerprintProvider
 */
export function createSignInPageWithFingerprint() {
  return function SignInPage() {
    return (
      <div className={clerkPageContainerClassName}>
        <SignInWithFingerprint />
      </div>
    );
  };
}
