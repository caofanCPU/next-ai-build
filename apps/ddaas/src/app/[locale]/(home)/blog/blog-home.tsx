import { appConfig } from '@/lib/appConfig';
import { siteDocs } from '@/lib/site-docs';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { BlogHomeClient } from './blog-home-client';

const sourceKey = 'blog';

export type BlogHomeItem = {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  href: string;
};

export async function buildBlogHomeItems(locale: string) {
  const source = await siteDocs.getContentSource(sourceKey);
  const entries = source.generateParams('slug', 'locale') as Array<{
    slug: string[];
    locale: string;
  }>;

  return entries
    .filter(({ locale: entryLocale }) => entryLocale === locale)
    .map(({ slug, locale: entryLocale }) => {
      const page = source.getPage(slug, entryLocale);

      if (!page) {
        return null;
      }

      return {
        title: page.data.title ?? slug.join('/'),
        description: page.data.description,
        date: typeof page.data.date === 'string' ? page.data.date : undefined,
        author: typeof page.data.author === 'string' ? page.data.author : undefined,
        tags: Array.isArray(page.data.tags)
          ? page.data.tags.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
          : undefined,
        href: getAsNeededLocalizedUrl(
          entryLocale,
          `/${sourceKey}/${slug.join('/')}`,
          appConfig.i18n.localePrefixAsNeeded,
          appConfig.i18n.defaultLocale,
        ),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => {
      const aTime = a.date ? Date.parse(a.date) : 0;
      const bTime = b.date ? Date.parse(b.date) : 0;
      return bTime - aTime;
    });
}

export async function BlogHome({
  locale,
}: {
  locale: string;
}) {
  const items = await buildBlogHomeItems(locale);

  return (
    <BlogHomeClient
      locale={locale}
      items={items}
      localePrefixAsNeeded={appConfig.i18n.localePrefixAsNeeded}
      defaultLocale={appConfig.i18n.defaultLocale}
    />
  );
}
