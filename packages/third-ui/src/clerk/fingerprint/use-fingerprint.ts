'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createFingerprintHeaders,
  getOrCreateFirstTouchData,
  getOrGenerateFingerprintId,
  setFingerprintId,
} from './fingerprint-client';
import type {
  FingerprintConfig,
  UseFingerprintResult,
  XCredit,
  XSubscription,
  XUser
} from './types';
import { FINGERPRINT_SOURCE_REFER, isDebugFingerprintId, isValidFingerprintId } from './fingerprint-shared'

/**
 * Hook for managing fingerprint ID and anonymous user data
 * Accepts configuration to customize API endpoint and behavior
 */
export function useFingerprint(config: FingerprintConfig): UseFingerprintResult {
  // Server-side rendering guard.
  if (typeof window === 'undefined') {
    return {
      fingerprintId: null,
      xUser: null,
      xCredit: null,
      xSubscription: null,
      isLoading: false,
      isInitialized: false,
      error: 'Server-side rendering is not supported',
      clearError: () => {},
      initializeAnonymousUser: async () => {},
      refreshUserData: async () => {},
    };
  }

  const [fingerprintId, setFingerprintIdState] = useState<string | null>(null);
  const [xUser, setXUser] = useState<XUser | null>(null);
  const [xCredit, setXCredit] = useState<XCredit | null>(null);
  const [xSubscription, setXSubscription] = useState<XSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitializingAnonymousUserRef = useRef(false);
  const requestedAnonymousFingerprintRef = useRef<string | null>(null);
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Phase 1: initialize fingerprint ID.
   */
  const initializeFingerprintId = useCallback(async () => {
    try {
      // Capture first-touch as early as possible before any in-site navigation can overwrite context.
      getOrCreateFirstTouchData();
      const currentFingerprintId = await getOrGenerateFingerprintId();
      setFingerprintIdState(currentFingerprintId);
      return currentFingerprintId;
    } catch (error) {
      console.error('Failed to initialize fingerprint ID:', error);
      setError('Failed to generate fingerprint ID');
      return null;
    }
  }, []);

  /**
   * Phase 2: initialize anonymous user.
   */
  const initializeAnonymousUser = useCallback(async () => {
    if (!fingerprintId) {
      console.warn('Cannot initialize user: Fingerprint ID is missing', { fingerprintId, isLoading, isInitialized });
      setError('Cannot initialize user: Missing fingerprint ID');
      return;
    }

    if (isInitializingAnonymousUserRef.current) {
      return;
    }

    if (requestedAnonymousFingerprintRef.current === fingerprintId && isInitialized) {
      return;
    }

    try {
      isInitializingAnonymousUserRef.current = true;
      requestedAnonymousFingerprintRef.current = fingerprintId;
      setIsLoading(true);
      setError(null);

      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [FINGERPRINT_SOURCE_REFER]: document.referrer || '',
          ...fingerprintHeaders,
        },
        body: JSON.stringify({ fingerprintId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to initialize anonymous user');
      }

      const data = await response.json();

      if (data.success) {
        const updatedXUser = data.xUser || { userId: '', fingerprintId, clerkUserId: '', email: '', status: '', createdAt: '' };
        setXUser(updatedXUser);
        setXCredit(data.xCredit || null);
        setXSubscription(data.xSubscription || null);
        setIsInitialized(true);

        const canonicalFingerprintId = data.xUser?.fingerprintId;
        if (
          canonicalFingerprintId &&
          isValidFingerprintId(canonicalFingerprintId) &&
          !isDebugFingerprintId(canonicalFingerprintId) &&
          canonicalFingerprintId !== fingerprintId
        ) {
          setFingerprintIdState(canonicalFingerprintId);
          setFingerprintId(canonicalFingerprintId);
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      requestedAnonymousFingerprintRef.current = null;
      console.error('Failed to initialize anonymous user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isInitializingAnonymousUserRef.current = false;
      setIsLoading(false);
    }
  }, [fingerprintId, config.apiEndpoint, isInitialized]);

  /**
   * Refresh user data with a POST request; the backend supports upsert semantics.
   */
  const refreshUserData = useCallback(async () => {
    if (!fingerprintId) {
      console.warn('Cannot refresh user data: Fingerprint ID is missing', { fingerprintId, isLoading, isInitialized });
      setError('Cannot refresh user data: Missing fingerprint ID');
      return;
    }

    try {
      setError(null);

      const fingerprintHeaders = await createFingerprintHeaders();
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...fingerprintHeaders,
        },
        body: JSON.stringify({ fingerprintId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to refresh user data');
      }

      const data = await response.json();
      if (data.success) {
        const updatedXUser = data.xUser || { userId: '', fingerprintId, clerkUserId: '', email: '', status: '', createdAt: '' };
        setXUser(updatedXUser);
        setXCredit(data.xCredit || null);
        setXSubscription(data.xSubscription || null);
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [fingerprintId, config.apiEndpoint]);

  // Phase 1: generate fingerprint ID after page load.
  useEffect(() => {
    const initFingerprint = async () => {
      setIsLoading(true);
      await initializeFingerprintId();
      setIsLoading(false);
    };

    initFingerprint();
  }, [initializeFingerprintId]);

  // Phase 2: initialize the user once a fingerprint ID is available; the backend supports upsert semantics.
  useEffect(() => {
    if (!fingerprintId || isInitialized || isLoading || error || config.autoInitialize === false) return;
    
    // Use POST directly; the backend handles lookup and create-if-missing behavior.
    initializeAnonymousUser();
  }, [fingerprintId, isInitialized, isLoading, error, initializeAnonymousUser, config.autoInitialize]);

  return {
    fingerprintId,
    xUser,
    xCredit,
    xSubscription,
    isLoading,
    isInitialized,
    error,
    clearError,
    initializeAnonymousUser,
    refreshUserData,
  };
}
