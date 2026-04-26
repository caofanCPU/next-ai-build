import { SiteIcon } from '@/lib/site-config';
import { getTranslations } from 'next-intl/server';
import { localePrefixAsNeeded, defaultLocale } from '@/lib/appConfig';
import {
  HomeTitle,
  createSiteBaseLayoutConfig,
  type SiteBaseLayoutConfig,
} from '@third-ui/fuma/base';
import { getAsNeededLocalizedUrl } from '@lib/utils';

export async function baseOptions(locale: string): Promise<SiteBaseLayoutConfig> {
  const t = await getTranslations({ locale: locale, namespace: 'home' });
  return createSiteBaseLayoutConfig({
    homeUrl: getAsNeededLocalizedUrl(locale, '/', localePrefixAsNeeded, defaultLocale),
    title: (
      <>
        <SiteIcon />
        <HomeTitle>
          {t('title')}
        </HomeTitle>
      </>
    ),
    transparentMode: 'none',
  });
}
