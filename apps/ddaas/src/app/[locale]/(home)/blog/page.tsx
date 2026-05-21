import { appConfig } from '@/lib/appConfig';
import { createLocalizedMetadata } from '@third-ui/lib/seo-metadata';
import { BlogHome } from './blog-home';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return createLocalizedMetadata({
    namespace: 'metadata.blog',
    url: {
      locale,
      pathname: '/blog',
      baseUrl: appConfig.baseUrl,
      locales: appConfig.i18n.locales,
      defaultLocale: appConfig.i18n.defaultLocale,
      localePrefixAsNeeded: appConfig.i18n.localePrefixAsNeeded,
    },
  });
}

export default async function BlogHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return BlogHome({ locale });
}
