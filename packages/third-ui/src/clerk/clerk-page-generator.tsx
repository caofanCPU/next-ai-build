import { SignIn, SignUp, Waitlist } from '@clerk/nextjs';

// Legacy page generators (for backward compatibility)
export function createSignInPage() {
  return function SignInPage() {
    return (
      <div className="flex-1 flex justify-center m-16">
        <SignIn />
      </div>
    );
  };
}

export function createSignUpPage() {
  return function SignUpPage() {
    return (
      <div className="flex-1 flex justify-center m-16">
        <SignUp />
      </div>
    );
  };
}

export function createWaitlistPage() {
  return function WaitlistPage() {
    return (
      <div className="flex-1 flex justify-center m-16">
        <Waitlist />
      </div>
    );
  };
}

// Note: Fingerprint-aware page generators moved to client-side only
// Use the fingerprint components directly in your client-side code 