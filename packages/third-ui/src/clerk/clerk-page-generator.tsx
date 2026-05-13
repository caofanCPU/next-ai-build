import { SignIn, SignUp, Waitlist } from '@clerk/nextjs';
import {
  clerkAuthPageAppearance,
  clerkAuthPageContainerClassName,
} from './clerk-auth-appearance';

// Legacy page generators (for backward compatibility)
export function createSignInPage() {
  return function SignInPage() {
    return (
      <div className={clerkAuthPageContainerClassName}>
        <SignIn appearance={clerkAuthPageAppearance} />
      </div>
    );
  };
}

export function createSignUpPage() {
  return function SignUpPage() {
    return (
      <div className={clerkAuthPageContainerClassName}>
        <SignUp appearance={clerkAuthPageAppearance} />
      </div>
    );
  };
}

export function createWaitlistPage() {
  return function WaitlistPage() {
    return (
      <div className={clerkAuthPageContainerClassName}>
        <Waitlist />
      </div>
    );
  };
}

// Note: Fingerprint-aware page generators moved to client-side only
// Use the fingerprint components directly in your client-side code 
