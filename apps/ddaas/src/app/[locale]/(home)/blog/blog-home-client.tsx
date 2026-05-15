'use client';

import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { ArrowRightIcon, CircleSmallIcon, ExternalLinkIcon, RssIcon } from '@windrun-huaiin/base-ui/icons';
import { cn, getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { themeHeroEyesOnClass, themeIconColor, themeRingColor } from '@base-ui/lib';
import { AnimeBeamFrame } from '@third-ui/main/anime';

type BlogCardItem = {
  title: string;
  description?: string;
  date?: string;
  author?: string;
  tags?: string[];
  href: string;
  icon?: ReactNode;
};

export function BlogHomeClient({
  locale,
  items,
  localePrefixAsNeeded,
  defaultLocale,
}: {
  locale: string;
  items: BlogCardItem[];
  localePrefixAsNeeded: boolean;
  defaultLocale: string;
}) {
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [pressedHref, setPressedHref] = useState<string | null>(null);
  const heroAccentClass = themeHeroEyesOnClass;

  const localizedHomeHref = useMemo(
    () => getAsNeededLocalizedUrl(locale, '/blog', localePrefixAsNeeded, defaultLocale),
    [defaultLocale, locale, localePrefixAsNeeded],
  );

  return (
    <main className="min-h-screen bg-neutral-100 mt-12 px-4 pb-12 pt-6 text-neutral-950 dark:bg-neutral-950 dark:text-neutral-50 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="mb-8 overflow-hidden rounded-lg border border-black/10 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-neutral-900/80 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                <RssIcon className={cn('h-4 w-4', themeIconColor)} />
                Blog
              </div>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                <span>Articles and thoughts about</span>{' '}
                <span className={cn('bg-clip-text text-transparent', heroAccentClass)}>various topics</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:text-base">
                {items.length
                  ? 'Browse the latest posts, ideas, and design notes. Each card is driven by MDX frontmatter.'
                  : 'No blog posts were found under the current source.'}
              </p>
            </div>

            <Link
              href={localizedHomeHref}
              prefetch={false}
              className="inline-flex items-center gap-2 self-start rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:border-white/20 dark:hover:bg-neutral-800 lg:self-auto"
            >
              <span>Browse archive</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const active = hoveredHref === item.href || pressedHref === item.href;
            const content = (
              <Link
                href={item.href}
                prefetch={false}
                onTouchStart={() => setPressedHref(item.href)}
                onTouchEnd={() => setPressedHref((current) => (current === item.href ? null : current))}
                onTouchCancel={() => setPressedHref((current) => (current === item.href ? null : current))}
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref((current) => (current === item.href ? null : current))}
                onFocus={() => setHoveredHref(item.href)}
                onBlur={() => setHoveredHref((current) => (current === item.href ? null : current))}
                className={cn(
                  'group flex h-62 flex-col rounded-lg border border-black/10 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-neutral-900 sm:h-64 sm:p-5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-100 dark:focus-visible:ring-offset-neutral-950',
                  themeRingColor,
                )}
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-black/5 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">
                        {item.icon ?? <CircleSmallIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <h2 className="line-clamp-1 text-base font-semibold leading-6 text-neutral-950 dark:text-neutral-50">
                          {item.title}
                        </h2>
                        {item.author ? (
                          <p className="mt-1 line-clamp-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {item.author}
                          </p>
                        ) : (
                          <p className="mt-1 h-4 text-xs text-transparent select-none">&nbsp;</p>
                        )}
                      </div>
                    </div>
                    <ExternalLinkIcon className="mt-1 h-4 w-4 shrink-0 text-neutral-400 transition group-hover:text-neutral-700 dark:text-neutral-500 dark:group-hover:text-neutral-200" />
                  </div>

                  <div className="min-h-0 flex-1">
                    {item.description ? (
                      <p className="line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        {item.description}
                      </p>
                    ) : (
                      <p className="line-clamp-2 text-sm leading-6 text-transparent select-none">&nbsp;</p>
                    )}
                  </div>

                  <div className="mt-4 flex min-h-9 flex-wrap items-center gap-2">
                    {item.date ? (
                      <span className="rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                        {item.date}
                      </span>
                    ) : (
                      <span className="rounded-full border border-transparent px-2.5 py-1 text-xs text-transparent select-none">
                        &nbsp;
                      </span>
                    )}
                    {item.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-neutral-600 transition-colors dark:border-white/10 dark:text-neutral-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );

            return (
              <div
                key={item.href}
                className="h-full"
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref((current) => (current === item.href ? null : current))}
                onFocus={() => setHoveredHref(item.href)}
                onBlur={() => setHoveredHref((current) => (current === item.href ? null : current))}
                onTouchStart={() => setPressedHref(item.href)}
                onTouchEnd={() => setPressedHref((current) => (current === item.href ? null : current))}
                onTouchCancel={() => setPressedHref((current) => (current === item.href ? null : current))}
              >
                {active ? (
                  <AnimeBeamFrame
                    active
                    interactive={false}
                    tone="theme"
                    radius={20}
                    className="h-full"
                  >
                    {content}
                  </AnimeBeamFrame>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
