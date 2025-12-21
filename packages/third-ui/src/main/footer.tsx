import { getTranslations } from 'next-intl/server';
import { globalLucideIcons as icons } from '@windrun-huaiin/base-ui/components/server';
import Link from "next/link";

interface FooterData {
  terms: string;
  privacy: string;
  contactUs: string;
  email: string;
  copyright: string;
  company: string;
}

export async function Footer({ locale }: { locale: string }) {
  const tFooter = await getTranslations({ locale, namespace: 'footer' });
  
  const data: FooterData = {
    terms: tFooter('terms', { defaultValue: 'Terms of Service' }),
    privacy: tFooter('privacy', { defaultValue: 'Privacy Policy' }),
    contactUs: tFooter('contactUs', { defaultValue: 'Contact Us' }),
    email: tFooter('email'),
    company: tFooter('company'),
    copyright: tFooter('copyright', { year: new Date().getFullYear(), name: tFooter('company') })
  };

  return (
    <div className="mb-10 w-full mx-auto border-t-purple-700/80 border-t">
      <footer>
        <div className="w-full flex flex-col items-center justify-center px-4 py-8 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-xs sm:gap-x-6">
            <Link href={`/${locale}/legal/terms`} className="flex items-center space-x-1 hover:underline">
              <icons.ReceiptText className="h-3.5 w-3.5"/>
              <span>{data.terms}</span>
            </Link>
            <Link href={`/${locale}/legal/privacy`} className="flex items-center space-x-1 hover:underline">
              <icons.ShieldUser className="h-3.5 w-3.5"/>
              <span>{data.privacy}</span>
            </Link>
            <div className="relative group">
              <div className="absolute left-2/3 -translate-x-1/4 bottom-full mb-1 hidden group-hover:block bg-zinc-600 text-white text-xs rounded px-3 py-1 whitespace-nowrap z-10 shadow-lg">
                {data.email}
              </div>
              <a
                href={`mailto:${data.email}`}
                className="flex items-center space-x-1 underline cursor-pointer px-2"
              >
                <icons.Mail className="h-3.5 w-3.5"/>
                <span>{data.contactUs}</span>
              </a>
            </div>
          </div>
          <div className="text-xs text-center">
            <span>{data.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

