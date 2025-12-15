import { getTranslations } from 'next-intl/server';
import { ClerkUserClient } from './clerk-user-client';

interface ClerkUserProps {
  locale: string;
  // default as true, 'cause Clerk direct is not well, so just use model for sign-in/sign-up
  clerkAuthInModal?: boolean;
  showSignUp?: boolean;
}

interface ClerkUserData {
  signIn: string;
  signUp: string;
  signUpBonus: string;
  signUpBonusTooltip: string;
  terms: string;
  privacy: string;
  locale: string;
  clerkAuthInModal: boolean;
  showSignUp: boolean;
}

export async function ClerkUser({ 
  locale, 
  clerkAuthInModal = true,
  showSignUp = true
}: ClerkUserProps) {
  const t = await getTranslations({ locale, namespace: 'clerk' });
  const t2 = await getTranslations({ locale, namespace: 'footer' });
  
  const data: ClerkUserData = {
    signIn: t('signIn'),
    signUp: t('signUp'),
    signUpBonus: t('signUpBonus'),
    signUpBonusTooltip: t('signUpBonusTooltip'),
    terms: t2('terms'),
    privacy: t2('privacy'),
    locale,
    clerkAuthInModal,
    showSignUp
  };

  return <ClerkUserClient data={data} />;
}