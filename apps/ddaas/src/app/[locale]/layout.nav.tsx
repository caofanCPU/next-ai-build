import Preview from '@/../public/banner.webp';
import {
  FingerprintIcon,
  HighlighterIcon,
  MmdIcon,
  PaletteIcon,
  ShieldUserIcon,
  SnippetsIcon,
  SparklesIcon,
} from '@base-ui/icons';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import {
  createLocalizedNavContext,
  createLocalizedNavGroup,
  createLocalizedNavLink,
  type SiteMenuGroupConfig,
  type SiteMenuLeafConfig,
  type SiteNavItemConfig,
} from '@third-ui/fuma/base';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
import { defaultLocale, localePrefixAsNeeded } from '@/lib/appConfig';

function renderMenuBanner() {
  return (
    <div className="-mx-3 -mt-3">
      <Image
        src={Preview}
        alt="Preview"
        className="rounded-t-lg object-cover"
        style={{
          maskImage: 'linear-gradient(to bottom,white 60%,transparent)',
        }}
      />
    </div>
  );
}

function createNavContext(locale: string) {
  return createLocalizedNavContext({
    locale,
    localePrefixAsNeeded,
    defaultLocale,
    localizeHref: getAsNeededLocalizedUrl,
  });
}

const previewTestLinks: SiteMenuLeafConfig[] = [
  {
    text: 'Preview Hub',
    description: 'Entry page for all preview and playground routes.',
    path: '/test',
    prefetch: false,
    icon: <FingerprintIcon />,
    className: 'lg:col-start-2 lg:row-start-1',
  },
  {
    text: 'UI Playground',
    description: 'Component and interaction preview cases.',
    path: '/test/ui',
    prefetch: false,
    icon: <SparklesIcon />,
    className: 'lg:col-start-2 lg:row-start-2',
  },
  {
    text: 'Color Lab',
    description: 'Theme color and visual token preview.',
    path: '/test/color',
    prefetch: false,
    icon: <PaletteIcon />,
    className: 'lg:col-start-3 lg:row-start-1',
  },
  {
    text: 'AI Runtime',
    description: 'AI runtime and prompt playground.',
    path: '/test/ai',
    prefetch: false,
    icon: <HighlighterIcon />,
    className: 'lg:col-start-3 lg:row-start-2',
  },
];

const docsLinks: SiteMenuLeafConfig[] = [
  {
    text: 'FumaMDX',
    description: 'FumaMDX tips',
    path: '/docs/introduction/fuma-mdx',
    prefetch: false,
    icon: <ShieldUserIcon />,
    className: 'lg:col-start-2 lg:row-start-1',
  },
  {
    text: 'Quick generation',
    description: 'MDX Snippets',
    path: '/docs/introduction/mdx-snippets',
    prefetch: false,
    icon: <SnippetsIcon />,
    className: 'lg:col-start-2 lg:row-start-2',
  },
  {
    text: 'Codeblock',
    description: 'Codeblock full case',
    path: '/docs/introduction/mdx-shiki',
    prefetch: false,
    icon: <HighlighterIcon />,
    className: 'lg:col-start-3 lg:row-start-1',
  },
  {
    text: 'Graph',
    description: 'Mermaid showcase.',
    path: '/docs/introduction/mdx-mermaid',
    prefetch: false,
    icon: <MmdIcon />,
    className: 'lg:col-start-3 lg:row-start-2',
  },
];

const levelMenus: SiteMenuGroupConfig[] = [
  {
    text: 'docs',
    path: '/docs',
    prefetch: false,
    landing: {
      text: 'DDaaS Site',
      description: 'Docs Driven as a Service.',
      path: '/docs/introduction',
      prefetch: false,
    },
    items: docsLinks,
  },
  {
    text: 'preview',
    path: '/test',
    prefetch: false,
    landing: {
      text: 'Preview Suite',
      description: 'Preview pages and interactive playgrounds.',
      path: '/test',
      prefetch: false,
    },
    items: previewTestLinks,
  },
];

export async function primaryNavLinks(locale: string): Promise<SiteNavItemConfig[]> {
  const t1 = await getTranslations({ locale, namespace: 'linkPreview' });
  const context = createNavContext(locale);

  return [
    createLocalizedNavLink(
      {
        text: t1('blog'),
        path: '/blog',
        prefetch: false,
      },
      context,
    ),
    createLocalizedNavLink(
      {
        text: t1('pricing'),
        path: '/pricing',
        prefetch: false,
      },
      context,
    ),
  ];
}

export async function levelNavLinks(locale: string): Promise<SiteNavItemConfig[]> {
  const t1 = await getTranslations({ locale, namespace: 'linkPreview' });
  const context = createNavContext(locale);

  return levelMenus.map((item) =>
    createLocalizedNavGroup(
      {
        ...item,
        text: t1(item.text as string),
      },
      context,
      {
        featuredBanner: renderMenuBanner(),
      },
    ),
  );
}

