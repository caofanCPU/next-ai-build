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
import { SiteIcon } from '@/lib/site-config';
import { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { HTMLAttributes, ReactNode } from 'react';
import { ClerkUser } from '@third-ui/clerk/server';
import { i18n } from '@/i18n';
import { appConfig, localePrefixAsNeeded, defaultLocale } from '@/lib/appConfig';
import { CreditPopover } from '@/components/credit-popover';
import { ExtendedLinkItem, HomeTitle } from '@third-ui/fuma/base';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';

type MenuLeafConfig = {
  text: string;
  description: string;
  path: string;
  icon?: ReactNode;
  className?: string;
};

type LevelMenuConfig = {
  text: string;
  path: string;
  landing: MenuLeafConfig;
  items: MenuLeafConfig[];
};

type MenuItemType = {
  type?: 'main';
  text: ReactNode;
  description?: ReactNode;
  url: string;
  external?: boolean;
  menu?: HTMLAttributes<HTMLElement> & { banner?: ReactNode };
};

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

function buildMenuLeaf(locale: string, item: MenuLeafConfig): MenuItemType {
  return {
    type: 'main',
    text: item.text,
    description: item.description,
    url: getAsNeededLocalizedUrl(locale, item.path, localePrefixAsNeeded, defaultLocale),
    menu: {
      ...(item.className ? { className: item.className } : {}),
      ...(item.icon ? { banner: item.icon } : {}),
    },
  };
}

function buildLevelMenu(locale: string, item: LevelMenuConfig): ExtendedLinkItem {
  return {
    type: 'menu',
    text: item.text,
    url: getAsNeededLocalizedUrl(locale, item.path, localePrefixAsNeeded, defaultLocale),
    items: [
      {
        ...buildMenuLeaf(locale, item.landing),
        menu: {
          banner: renderMenuBanner(),
          className: 'md:row-span-2',
        },
      },
      ...item.items.map((child) => buildMenuLeaf(locale, child)),
    ],
  };
}

const previewTestLinks: MenuLeafConfig[] = [
  {
    text: 'Preview Hub',
    description: 'Entry page for all preview and playground routes.',
    path: '/test',
    icon: <FingerprintIcon />,
    className: 'lg:col-start-2 lg:row-start-1',
  },
  {
    text: 'UI Playground',
    description: 'Component and interaction preview cases.',
    path: '/test/ui',
    icon: <SparklesIcon />,
    className: 'lg:col-start-2 lg:row-start-2',
  },
  {
    text: 'Color Lab',
    description: 'Theme color and visual token preview.',
    path: '/test/color',
    icon: <PaletteIcon />,
    className: 'lg:col-start-3 lg:row-start-1',
  },
  {
    text: 'AI Runtime',
    description: 'AI runtime and prompt playground.',
    path: '/test/ai',
    icon: <HighlighterIcon />,
    className: 'lg:col-start-3 lg:row-start-2',
  },
];

const docsLinks: MenuLeafConfig[] = [
  {
    text: 'FumaMDX',
    description: 'FumaMDX tips',
    path: '/docs/introduction/fuma-mdx',
    icon: <ShieldUserIcon />,
    className: 'lg:col-start-2 lg:row-start-1',
  },
  {
    text: 'Quick generation',
    description: 'MDX Snippets',
    path: '/docs/introduction/mdx-snippets',
    icon: <SnippetsIcon />,
    className: 'lg:col-start-2 lg:row-start-2',
  },
  {
    text: 'Codeblock',
    description: 'Codeblock full case',
    path: '/docs/introduction/mdx-shiki',
    icon: <HighlighterIcon />,
    className: 'lg:col-start-3 lg:row-start-1',
  },
  {
    text: 'Graph',
    description: 'Mermaid showcase.',
    path: '/docs/introduction/mdx-mermaid',
    icon: <MmdIcon />,
    className: 'lg:col-start-3 lg:row-start-2',
  },
];

const levelMenus: LevelMenuConfig[] = [
  {
    text: 'docs',
    path: '/docs',
    landing: {
      text: 'DDaaS Site',
      description: 'Docs Driven as a Service.',
      path: '/docs/introduction',
    },
    items: docsLinks,
  },
  {
    text: 'preview',
    path: '/test',
    landing: {
      text: 'Preview Suite',
      description: 'Preview pages and interactive playgrounds.',
      path: '/test',
    },
    items: previewTestLinks,
  },
];

// 首页普通菜单
export async function homeNavLinks(locale: string): Promise<ExtendedLinkItem[]> {
  const t1 = await getTranslations({ locale: locale, namespace: 'linkPreview' });
  return [
    {
      text: t1('blog'),
      url: getAsNeededLocalizedUrl(locale, '/blog', localePrefixAsNeeded, defaultLocale),
    },
    {
      text: t1('pricing'),
      url: getAsNeededLocalizedUrl(locale, '/pricing', localePrefixAsNeeded, defaultLocale),
    },
    {
      type: 'custom',
      secondary: true,
      mobilePinned: true,
      children: <CreditPopover locale={locale} />,
    },
    {
      type: 'custom',
      // false就先排左边的菜单, true就先排右边的按钮
      secondary: true,
      // true代表在移动端也会出现在主菜单栏上，不会被折叠
      mobilePinned: true,
      children: <ClerkUser locale={locale} clerkAuthInModal={appConfig.style.clerkAuthInModal} showSignUp={true}/>
    },
  ];
}

// 层级特殊菜单
export async function levelNavLinks(locale: string): Promise<ExtendedLinkItem[]> {
  const t1 = await getTranslations({ locale: locale, namespace: 'linkPreview' });
  return levelMenus.map((item) =>
    buildLevelMenu(locale, {
      ...item,
      text: t1(item.text),
    }),
  );
}

export async function baseOptions(locale: string): Promise<BaseLayoutProps> {
  const t = await getTranslations({ locale: locale, namespace: 'home' });
  return {
    // 导航Header配置
    nav: {
      url: getAsNeededLocalizedUrl(locale, '/', localePrefixAsNeeded, defaultLocale),
      title: (
        <>
          <SiteIcon />
          <HomeTitle>
            {t('title')}
          </HomeTitle>
        </>
      ),
      // 导航Header, 透明模式选项: none | top | always
      // https://fumadocs.dev/docs/ui/layouts/docs#transparent-mode
      transparentMode: 'none',
    },
    // 导航Header, 语言切换
    i18n,
    // 导航Header, Github链接
    githubUrl: appConfig.github,
  };
}
