'use client';

import { SignUp } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useFingerprintContextSafe } from './fingerprint/fingerprint-provider';

/**
 * SignUp component with fingerprint awareness
 * 如果没有FingerprintProvider，会优雅降级为普通SignUp组件
 * 如果有FingerprintProvider，会处理fingerprint相关逻辑
 */
export function SignUpWithFingerprint() {
  const fingerprintContext = useFingerprintContextSafe();
  
  // 如果没有fingerprint context，使用默认值
  const { 
    fingerprintId = null, 
    xUser = null, 
    isInitialized = false,
    initializeAnonymousUser = async () => {}
  } = fingerprintContext || {};

  // 准备传递给Clerk的metadata，包含匿名用户信息
  const unsafeMetadata = {
    user_id: xUser?.userId || null,
    fingerprint_id: fingerprintId || null,
  };

  // 确保匿名用户已初始化
  useEffect(() => {
    if (!isInitialized && fingerprintId) {
      initializeAnonymousUser();
    }
  }, [fingerprintId, isInitialized, initializeAnonymousUser]);

  return <SignUp unsafeMetadata={unsafeMetadata} />;
}

