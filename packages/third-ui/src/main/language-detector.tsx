/**
 * @license
 * MIT License
 * Copyright (c) 2026 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use client'

import { XIcon } from "@windrun-huaiin/base-ui/icons"
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type I18nConfig = {
  locales: readonly string[];
  detector: {
    storagePrefix: string;
    storageKey: string;
    autoCloseTimeout: number;
    expirationDays: number;
  };
};

interface LanguageDetectorProps {
  i18nConfig: I18nConfig;
}

type Locale = string;

interface LanguagePreference {
  locale: string;
  status: 'accepted' | 'rejected';
  timestamp: number;
}

export function LanguageDetector({ i18nConfig }: LanguageDetectorProps) {
  const [show, setShow] = useState(false)
  const [detectedLocale, setDetectedLocale] = useState<Locale | null>(null)
  const currentLocale = useLocale()
  const router = useRouter()
  const t = useTranslations('languageDetection')

  // Get the storage key from the configuration
  const LANGUAGE_PREFERENCE_KEY = `${i18nConfig.detector.storagePrefix}-${i18nConfig.detector.storageKey}`

  useEffect(() => {
    // Get the browser language
    const browserLang = navigator.language.split('-')[0] as Locale

    // Get the language preference from localStorage
    const savedPreference = localStorage.getItem(LANGUAGE_PREFERENCE_KEY)
    const preference: LanguagePreference | null = savedPreference
      ? JSON.parse(savedPreference)
      : null

    // Check if the language detection box should be displayed
    const shouldShowDetector = () => {
      if (!preference) return true;

      // If the stored language is the same as the current language, do not display the detection box
      if (preference.locale === currentLocale) return false;

      // If the user has previously rejected switching to this language, do not display the detection box
      if (preference.status === 'rejected' && preference.locale === browserLang) return false;

      // If the user has previously accepted switching to this language, do not display the detection box
      if (preference.status === 'accepted' && preference.locale === currentLocale) return false;

      // Use the expiration time from the configuration
      const expirationMs = i18nConfig.detector.expirationDays * 24 * 60 * 60 * 1000;
      if (Date.now() - preference.timestamp < expirationMs) return false;

      return true;
    }

    // Check if the browser language is in the supported language list and needs to display the detection box
    if ((i18nConfig.locales as string[]).includes(browserLang) &&
      browserLang !== currentLocale &&
      shouldShowDetector()) {
      setDetectedLocale(browserLang)
      setShow(true)

      // Use the automatic closing time from the configuration
      const timer = setTimeout(() => {
        console.log('[LanguageDetector] Auto closing after timeout')
        setShow(false)
        // Save the rejected state when the automatic closing occurs
        savePreference(browserLang, 'rejected')
      }, i18nConfig.detector.autoCloseTimeout)

      return () => clearTimeout(timer)
    }
  }, [currentLocale])

  // Save the language preference to localStorage
  const savePreference = (locale: string, status: 'accepted' | 'rejected') => {
    const preference: LanguagePreference = {
      locale,
      status,
      timestamp: Date.now()
    }
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, JSON.stringify(preference))
  }

  const handleLanguageChange = () => {
    if (detectedLocale) {
      // Save the accepted state
      savePreference(detectedLocale, 'accepted')

      // Get the current path
      const pathname = window.location.pathname
      // Replace the language part
      const newPathname = pathname.replace(`/${currentLocale}`, `/${detectedLocale}`)
      // Redirect to the new path
      router.push(newPathname)
      setShow(false)
    }
  }

  const handleClose = () => {
    if (detectedLocale) {
      // Save the rejected state
      savePreference(detectedLocale, 'rejected')
    }
    setShow(false)
  }

  if (!detectedLocale || !show) return null

  return (
    <div className="fixed top-16 right-4 z-40 w-[420px]">
      <div className={`shadow-lg rounded-lg transition-all duration-300 ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} 
        bg-linear-to-r from-purple-100/95 via-white/95 to-purple-100/95 backdrop-blur-xs
        animate-gradient-x`}>
        <div className="relative px-6 py-4 overflow-hidden">
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('title')}
                </h3>
                <p className="text-base text-gray-600">
                  {t('description')} <span className="text-purple-500 font-semibold">{detectedLocale === 'zh' ? '中文' : 'English'}</span>?
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-base bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                {t('close')}
              </button>
              <button
                onClick={handleLanguageChange}
                className="flex-1 px-4 py-2 text-base bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                {t('changeAction')}
              </button>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-200/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  )
} 
