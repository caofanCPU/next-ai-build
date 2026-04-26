'use client';

import { SignUpButton, useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useFingerprintContextSafe } from './fingerprint/fingerprint-provider';

interface SignUpButtonWithFingerprintProps {
  mode: 'modal' | 'redirect',
  signUp: string;
}

export function SignUpButtonWithFingerprint({
  mode,
  signUp,
}: SignUpButtonWithFingerprintProps) {
  if (mode === 'redirect') {
    return (
      // 重定向模式则直接跳转到自定义注册页面
      <SignUpButton>
        <button 
          className="w-16 sm:w-20 h-8 sm:h-9 px-1.5 sm:px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-xs sm:text-sm whitespace-nowrap"
        >
          {signUp}
        </button>
      </SignUpButton>
    )
  }

  // 弹框模式则需要自定义注册按钮
  const fingerprintContext = useFingerprintContextSafe();

  // 如果没有fingerprint context，使用默认值
  const { 
    fingerprintId = null, 
    xUser = null, 
    isInitialized = false,
    initializeAnonymousUser = async () => {}
  } = fingerprintContext || {};

  const userId = xUser?.userId || null;
  const unsafeMetadata = {
    user_id: userId,
    fingerprint_id: fingerprintId || null,
  };

  // 确保匿名用户已初始化
  useEffect(() => {
    if (!isInitialized && fingerprintId) {
      initializeAnonymousUser();
    }
  }, [fingerprintId, isInitialized, initializeAnonymousUser]);

  const { openSignUp } = useClerk();
  

  const handleClick = () => {
    openSignUp({
      unsafeMetadata,
    });
  };

  return (
    <button 
      className="w-16 sm:w-20 h-8 sm:h-9 px-1.5 sm:px-2 border border-gray-300 rounded-full hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 text-center text-xs sm:text-sm whitespace-nowrap"
      onClick={handleClick}
    >
      {signUp}
    </button>
    );
}