import { SignIn, SignUp, Waitlist } from '@clerk/nextjs';

const clerkPageContainerClassName =
  'flex min-h-dvh w-full items-start justify-center px-6 pt-[calc(var(--fd-banner-height,0px)+var(--fd-header-height,3.5rem)+1rem)] pb-6 md:px-8 md:pt-[calc(var(--fd-banner-height,0px)+var(--fd-header-height,3.5rem)+1.5rem)] md:pb-8';

// Legacy page generators (for backward compatibility)
export function createSignInPage() {
  return function SignInPage() {
    return (
      <div className={clerkPageContainerClassName}>
        <SignIn />
      </div>
    );
  };
}

export function createSignUpPage() {
  return function SignUpPage() {
    return (
      <div className={clerkPageContainerClassName}>
        <SignUp />
      </div>
    );
  };
}

export function createWaitlistPage() {
  return function WaitlistPage() {
    return (
      <div className={clerkPageContainerClassName}>
        <Waitlist />
      </div>
    );
  };
}

// Note: Fingerprint-aware page generators moved to client-side only
// Use the fingerprint components directly in your client-side code 
