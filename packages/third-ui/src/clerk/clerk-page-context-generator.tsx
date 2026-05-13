'use client';

/**
 * Client-side page generators with fingerprint support
 * These should only be used in client-side code
 */

import { SignUpWithFingerprint } from './signup-with-fingerprint-client';
import { SignInWithFingerprint } from './signin-with-fingerprint-client';
import { clerkAuthPageContainerClassName } from './clerk-auth-appearance';

/**
 * Create a SignUp page with fingerprint support
 * Note: This must be used within a FingerprintProvider
 */
export function createSignUpPageWithFingerprint() {
  return function SignUpPage() {
    return (
      <div className={clerkAuthPageContainerClassName}>
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
      <div className={clerkAuthPageContainerClassName}>
        <SignInWithFingerprint />
      </div>
    );
  };
}
