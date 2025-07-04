'use client'

import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import { useLocale, useTranslations } from 'next-intl';
import Link from "next/link";

export function Footer() {
  const tFooter = useTranslations('footer');
  const locale = useLocale();

  return (
    <div className="mb-10 w-full mx-auto border-t-purple-700/80 border-t-1">
      <footer>
        <div className="w-full flex flex-col items-center justify-center px-4 py-8 space-y-3">
          {/* 第一行：居中icon跳转链接 */}
          <div className="flex items-center justify-center space-x-6 text-xs">
            <Link href={`/${locale}/legal/terms`} className="flex items-center space-x-1 hover:underline">
              <icons.ReceiptText className="h-3.5 w-3.5"/>
              <span>{tFooter('terms', { defaultValue: 'Terms of Service' })}</span>
            </Link>
            <Link href={`/${locale}/legal/privacy`} className="flex items-center space-x-1 hover:underline">
              <icons.ShieldUser className="h-3.5 w-3.5"/>
              <span>{tFooter('privacy', { defaultValue: 'Privacy Policy' })}</span>
            </Link>
            <div className="relative group">
              <div className="absolute left-2/3 -translate-x-1/4 bottom-full mb-1 hidden group-hover:block bg-zinc-600 text-white text-xs rounded px-3 py-1 whitespace-nowrap z-10 shadow-lg">
                {tFooter('email')}
              </div>
              <a
                href={`mailto:${tFooter('email')}`}
                className="flex items-center space-x-1 underline cursor-pointer px-2"
              >
                <icons.Mail className="h-3.5 w-3.5"/>
                <span>{tFooter('contactUs', { defaultValue: 'Contact Us' })}</span>
              </a>
            </div>
          </div>
          {/* 第二行：版权声明 */}
          <div className="text-xs text-center">
            <span>
              {tFooter('copyright', { year: new Date().getFullYear(), name: tFooter('company') })}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

