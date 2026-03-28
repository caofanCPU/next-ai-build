export const AUTH_HEADERS = {
  provider: 'x-auth-provider',
  providerUserId: 'x-auth-provider-user-id',
} as const;

export const AUTH_ERRORS = {
  unauthorized: 'UNAUTHORIZED',
  userNotFound: 'USER_NOT_FOUND',
} as const;

export type AuthProvider = 'clerk';

export interface ProviderIdentity {
  provider: AuthProvider;
  providerUserId: string;
}
