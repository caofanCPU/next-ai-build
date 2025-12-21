import { getTranslations } from 'next-intl/server';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import Link from "next/link";
import { FooterEmail } from './footer-email';
import { safeT } from '../lib/t-intl';

interface FooterData {
  terms: string;
  privacy: string;
  contactUs: string;
  email: string;
  copyright: string;
  company: string;
  clickToCopyText: string;
  copiedText: string;
}

export async function Footer({ locale }: { locale: string }) {
  const tFooter = await getTranslations({ locale, namespace: 'footer' });
  
  const company = safeT(tFooter, 'company', '');

  const data: FooterData = {
    terms: safeT(tFooter, 'terms', 'Terms of Service'),
    privacy: safeT(tFooter, 'privacy', 'Privacy Policy'),
    contactUs: safeT(tFooter, 'contactUs', 'Contact Us'),
    email: safeT(tFooter, 'email', ''),
    company: company,
    copyright: tFooter('copyright', { year: new Date().getFullYear(), name: company }),
    clickToCopyText: safeT(tFooter, 'clickToCopy', 'Click to copy'),
    copiedText: safeT(tFooter, 'copied', 'Copied!'),
  };

  return (
    <div className="mb-10 w-full mx-auto border-t-purple-700/80 border-t">
      <footer>
        <div className="w-full flex flex-col items-center justify-center px-4 py-8 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs sm:text-sm sm:gap-x-6">
            <Link href={`/${locale}/legal/terms`} className="flex items-center space-x-1 hover:underline">
              <icons.ReceiptText className="h-3.5 w-3.5"/>
              <span>{data.terms}</span>
            </Link>
            <Link href={`/${locale}/legal/privacy`} className="flex items-center space-x-1 hover:underline">
              <icons.ShieldUser className="h-3.5 w-3.5"/>
              <span>{data.privacy}</span>
            </Link>
            <FooterEmail email={data.email} clickToCopyText={data.clickToCopyText} copiedText={data.copiedText}>
              <icons.Mail className="h-3.5 w-3.5"/>
              <span>{data.contactUs}</span>
            </FooterEmail>
          </div>
          <div className="text-xs sm:text-sm text-center">
            <span>{data.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

