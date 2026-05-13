import { getTranslations } from 'next-intl/server';
import { cn } from '@windrun-huaiin/lib/utils';
import type { HTMLAttributes } from 'react';

export type SiteXProps = Omit<HTMLAttributes<HTMLSpanElement>, 'type'> & {
  locale: string;
  type: 'site' | 'email';
  namespace?: string;
  tKey?: string;
};

export async function SiteX({ locale, type, namespace, tKey, className, ...props }: SiteXProps) {
  let ns = namespace;
  let key = tKey;
  if (!ns) {
    ns = type === 'site' ? 'home' : 'footer';
  }
  if (!key) {
    key = type === 'site' ? 'title' : 'email';
  }
  const t = await getTranslations({ locale, namespace: ns });
  const text = t(key, { defaultValue: type === 'site' ? 'Site----' : '----@example.com' });

  if (type === 'site') {
    return (
      <strong
        {...props}
        className={cn(
          'font-extrabold text-sm',
          className
        )}
      >
        {text}
      </strong>
    );
  }
  if (type === 'email') {
    return (
      <a
        {...props}
        href={`mailto:${text}`}
        className={cn(
          'font-mono underline text-sm',
          className
        )}
      >
        {text}
      </a>
    );
  }
  return null;
} 