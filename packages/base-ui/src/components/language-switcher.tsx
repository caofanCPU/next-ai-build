/**
 * @license
 * MIT License
 * Copyright (c) 2026 D8ger
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use client'

import { GlobeIcon } from '@base-ui/icons'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@base-ui/ui/dropdown-menu'
import { LanguageButton } from '@base-ui/ui/language-button'

interface LanguageSwitcherProps {
  locales: readonly string[];
  localeLabels: Record<string, string>;
}

export function LanguageSwitcher({ locales, localeLabels }: LanguageSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPathname)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <LanguageButton
          variant="ghost"
          size="icon"
          className="bg-linear-to-r from-purple-400 to-pink-600 hover:from-purple-500 hover:to-pink-700 text-white transform hover:scale-110 transition-all duration-300"
        >
          <GlobeIcon className="h-5 w-5" />
        </LanguageButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={5}
        className="bg-white/90 dark:bg-gray-800/90 border-purple-100 dark:border-purple-800 w-[200px] p-2 backdrop-blur-xs translate-x-[50px]"
      >
        <div className="grid grid-cols-2 gap-1">
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              className={`
                          px-2 py-2 text-sm cursor-pointer text-center justify-center
                          transition-all duration-300 ease-in-out
                          hover:scale-105 hover:shadow-md
                          rounded-md whitespace-nowrap
                          ${locale === loc
                  ? 'bg-linear-to-r from-purple-400 to-pink-600 text-white font-medium shadow-lg scale-105'
                  : 'hover:bg-linear-to-r hover:from-purple-400/10 hover:to-pink-600/10 hover:text-transparent hover:bg-clip-text'
                }
                            `}
              onClick={() => handleLocaleChange(loc)}
            >
              {localeLabels[loc]}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
