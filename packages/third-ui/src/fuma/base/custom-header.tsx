'use client';

import {
  type ComponentProps,
  type CSSProperties,
  Fragment,
  type ReactNode,
  type FC,
  useMemo,
  useState,
} from 'react';
import { cva } from 'class-variance-authority';
import { ChevronDownIcon, LanguagesIcon } from '@windrun-huaiin/base-ui/icons';
import { cn } from '@windrun-huaiin/lib/utils';
import Link from 'fumadocs-core/link';
import { HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import {
  LinkItem,
  resolveLinkItems,
} from 'fumadocs-ui/layouts/shared';
import {
  type LanguageSelectProps,
  LanguageSelectText,
} from 'fumadocs-ui/layouts/shared/slots/language-select';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from 'fumadocs-ui/components/ui/navigation-menu';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { HeaderThemeSwitch } from './header-theme-switch';
import type { ExtendedLinkItem } from './site-layout-shared';

export type NavbarCSSVars = CSSProperties & {
  '--fd-banner-height'?: string;
  '--fd-header-height'?: string;
  '--fd-nav-max-width'?: string;
};

export interface CustomHomeHeaderProps extends HomeLayoutProps {
  /**
   * Banner height in rem units
   *
   * @defaultValue 0
   */
  bannerHeight?: number;

  /**
   * Header height in rem units
   *
   * @defaultValue 4
   */
  headerHeight?: number;

  /**
   * Max width for the navbar content area.
   *
   * @defaultValue 1400
   */
  maxContentWidth?: number | string;

  /**
   * Extra classes for the navbar surface.
   */
  navbarClassName?: string;

  /**
   * Whether the navbar floats above the page content.
   *
   * @defaultValue true
   */
  floating?: boolean;
  /**
   * Control order of action items on desktop.
   */
  desktopActionsOrder?: DesktopAction[];
  /**
   * Control order of quick actions on the mobile bar.
   */
  mobileBarActionsOrder?: MobileBarAction[];
  /**
   * Control order of utilities inside the mobile dropdown.
   */
  mobileMenuActionsOrder?: MobileMenuAction[];
}

export type DesktopAction =
  | 'search'
  | 'theme'
  | 'i18n'
  | 'secondary'
  | 'github';
export type MobileBarAction = 'pinned' | 'search' | 'menu';
export type MobileMenuAction =
  | 'secondary'
  | 'github'
  | 'separator'
  | 'i18n'
  | 'theme';

const DEFAULT_DESKTOP_ACTIONS: DesktopAction[] = [
  'search',
  'theme',
  'i18n',
  'secondary',
];
const DEFAULT_MOBILE_BAR_ACTIONS: MobileBarAction[] = [
  'pinned',
  'search',
  'menu',
];
const DEFAULT_MOBILE_MENU_ACTIONS: MobileMenuAction[] = [
  'secondary',
  'separator',
  'i18n',
  'theme',
];

export function CustomHomeHeader({
  nav = {},
  i18n = false,
  links,
  githubUrl,
  themeSwitch = {},
  searchToggle = {},
  bannerHeight = 0,
  headerHeight = 2.5,
  maxContentWidth = 1400,
  navbarClassName,
  floating = false,
  desktopActionsOrder = DEFAULT_DESKTOP_ACTIONS,
  mobileBarActionsOrder = DEFAULT_MOBILE_BAR_ACTIONS,
  mobileMenuActionsOrder = DEFAULT_MOBILE_MENU_ACTIONS,
}: CustomHomeHeaderProps) {
  const finalLinks = useMemo(
    () => resolveLinkItems({ links, githubUrl }),
    [links, githubUrl],
  );

  const navItems = finalLinks.filter((item) =>
    ['nav', 'all'].includes(item.on ?? 'all'),
  );
  const menuItems = finalLinks.filter((item) =>
    ['menu', 'all'].includes(item.on ?? 'all'),
  );
  const mobilePinnedItems = navItems.filter(
    (item) => isSecondary(item) && isMobilePinned(item),
  );
  const filteredMenuItems = menuItems.filter((item) => !isMobilePinned(item));
  const primaryMenuItems = filteredMenuItems.filter((item) => !isSecondary(item));
  const secondaryMenuItems = filteredMenuItems.filter(isSecondary);
  const desktopSecondaryItems = navItems.filter(isSecondary);
  const desktopActionsIncludeGithub = desktopActionsOrder.includes('github');
  const githubDesktopItem = desktopActionsIncludeGithub
    ? desktopSecondaryItems.find((item) => isGithubItem(item, githubUrl))
    : undefined;
  const desktopSecondaryDisplayItems =
    desktopActionsIncludeGithub && githubDesktopItem
      ? desktopSecondaryItems.filter((item) => !isGithubItem(item, githubUrl))
      : desktopSecondaryItems;

  const desktopActionNodes: Record<DesktopAction, ReactNode> = {
    search:
      searchToggle.enabled !== false
        ? searchToggle.components?.lg ?? null
        : null,
    theme:
      themeSwitch.enabled !== false
        ? themeSwitch.component ?? <HeaderThemeSwitch mode={themeSwitch?.mode} />
        : null,
    i18n: i18n ? (
      <CompactLanguageToggle>
        <LanguagesIcon className="size-5" />
      </CompactLanguageToggle>
    ) : null,
    secondary: desktopSecondaryDisplayItems.length ? (
      <ul className="flex flex-row gap-2 items-center empty:hidden">
        {desktopSecondaryDisplayItems.map((item, i) => (
          <NavbarLinkItem
            key={i}
            item={item}
            className={cn(
              item.type === 'icon' && [
                '-mx-1',
                i === 0 && 'ms-0',
                i === desktopSecondaryDisplayItems.length - 1 && 'me-0',
              ],
            )}
          />
        ))}
      </ul>
    ) : null,
    github: githubDesktopItem ? (
      <NavbarLinkItem
        item={githubDesktopItem}
        className={cn(githubDesktopItem.type === 'icon' && '-mx-1')}
      />
    ) : null,
  };

  const mobileMenuActionsIncludeGithub =
    mobileMenuActionsOrder.includes('github');
  const githubMobileMenuItem = mobileMenuActionsIncludeGithub
    ? secondaryMenuItems.find((item) => isGithubItem(item, githubUrl))
    : undefined;
  const secondaryMenuDisplayItems =
    mobileMenuActionsIncludeGithub && githubMobileMenuItem
      ? secondaryMenuItems.filter((item) => !isGithubItem(item, githubUrl))
      : secondaryMenuItems;

  const mobileMenuActionNodes: Record<MobileMenuAction, ReactNode> = {
    secondary: secondaryMenuDisplayItems.length ? (
      <>
        {secondaryMenuDisplayItems.map((item, i) => (
          <MenuLinkItem key={i} item={item} className="-me-1.5" />
        ))}
      </>
    ) : null,
    github: githubMobileMenuItem ? (
      <MenuLinkItem item={githubMobileMenuItem} className="-me-1.5" />
    ) : null,
    separator: <div role="separator" className="flex-1" />,
    i18n: i18n ? (
      <CompactLanguageToggle>
        <LanguagesIcon className="size-5" />
        <LanguageSelectText />
        <ChevronDownIcon className="size-3 text-fd-muted-foreground" />
      </CompactLanguageToggle>
    ) : null,
    theme:
      themeSwitch.enabled !== false
        ? themeSwitch.component ?? <HeaderThemeSwitch mode={themeSwitch?.mode} />
        : null,
  };
  const shouldRenderMobileUtilities = mobileMenuActionsOrder.some(
    (action) => action !== 'separator' && Boolean(mobileMenuActionNodes[action]),
  );
  const renderMobileMenuAction = (action: MobileMenuAction) => {
    if (action === 'separator' && !shouldRenderMobileUtilities) return null;
    return mobileMenuActionNodes[action];
  };

  const menuNode = (
    <Menu>
      <MenuTrigger
        aria-label="Toggle Menu"
        className={cn(
          buttonVariants({
            size: 'icon',
            color: 'ghost',
            className: 'group [&_svg]:size-5.5',
          }),
        )}
        enableHover={nav.enableHoverToOpen}
      >
        <ChevronDownIcon className="transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </MenuTrigger>
      <MenuContent className="sm:flex-row sm:items-center sm:justify-end">
        {primaryMenuItems.map((item, i) => (
          <MenuLinkItem key={i} item={item} className="sm:hidden" />
        ))}
        {shouldRenderMobileUtilities ? (
          <div className="-ms-1.5 flex flex-row items-center gap-1.5 max-sm:mt-2">
            {mobileMenuActionsOrder.map((action) => {
              const node = renderMobileMenuAction(action);
              if (!node) return null;
              return (
                <Fragment key={`mobile-menu-${action}`}>
                  {node}
                </Fragment>
              );
            })}
          </div>
        ) : null}
      </MenuContent>
    </Menu>
  );

  const mobilePinnedNode =
    mobilePinnedItems.length > 0 ? (
      <>
        {mobilePinnedItems.map((item, i) => (
          <NavbarLinkItem
            key={`mobile-pinned-${i}`}
            item={item}
            className="max-sm:-mr-1"
          />
        ))}
      </>
    ) : null;
  const mobileSearchNode =
    searchToggle.enabled !== false
      ? searchToggle.components?.sm ?? null
      : null;
  const mobileBarNodes: Record<MobileBarAction, ReactNode> = {
    pinned: mobilePinnedNode,
    search: mobileSearchNode,
    menu: menuNode,
  };
  const getMobileBarNode = (action: MobileBarAction) =>
    mobileBarNodes[action] ?? null;

  return (
    <CustomNavbar
      bannerHeight={bannerHeight}
      headerHeight={headerHeight}
      maxContentWidth={maxContentWidth}
      className={navbarClassName}
      floating={floating}
    >
      <Link
        href={nav.url ?? '/'}
        prefetch={false}
        className="inline-flex items-center gap-2.5 font-semibold"
      >
        {renderNavTitle(nav.title)}
      </Link>
      {nav.children}
      <ul className="flex flex-row items-center gap-2 px-6 max-sm:hidden">
        {navItems
          .filter((item) => !isSecondary(item))
          .map((item, i) => (
            <NavbarLinkItem key={i} item={item} className="text-sm" />
          ))}
      </ul>
      <div className="flex flex-row items-center justify-end gap-1.5 flex-1 max-lg:hidden">
        {desktopActionsOrder.map((action) => {
          const node = desktopActionNodes[action];
          if (!node) return null;
          return (
            <Fragment key={`desktop-${action}`}>
              {node}
            </Fragment>
          );
        })}
      </div>
      <ul className="flex flex-row items-center ms-auto -me-1.5 lg:hidden">
        {mobileBarActionsOrder.map((action) => {
          const node = getMobileBarNode(action);
          return node ? (
            <Fragment key={`mobile-bar-${action}`}>{node}</Fragment>
          ) : null;
        })}
      </ul>
    </CustomNavbar>
  );
}

interface CustomNavbarProps extends ComponentProps<'div'> {
  bannerHeight?: number;
  headerHeight?: number;
  maxContentWidth?: number | string;
  floating?: boolean;
}

function CustomNavbar({
  bannerHeight = 0,
  headerHeight = 2.5,
  maxContentWidth = 1400,
  className,
  style,
  floating = false,
  ...props
}: CustomNavbarProps) {
  const [value, setValue] = useState('');
  const isTransparent = false;

  const cssVars: NavbarCSSVars = {
    '--fd-banner-height': `${bannerHeight}rem`,
    '--fd-header-height': `${headerHeight}rem`,
    ...(maxContentWidth
      ? {
          '--fd-nav-max-width':
            typeof maxContentWidth === 'number'
              ? `${maxContentWidth}px`
              : maxContentWidth,
        }
      : {}),
  };

  const resolvedMaxWidth =
    maxContentWidth && maxContentWidth !== 0
      ? typeof maxContentWidth === 'number'
        ? `${maxContentWidth}px`
        : maxContentWidth
      : '88rem';
  const minNavWidth = '15rem';
  const widthStyle = floating
    ? { width: `clamp(${minNavWidth}, 100vw, ${resolvedMaxWidth})` }
    : { width: '100%', maxWidth: resolvedMaxWidth, minWidth: minNavWidth };
  const headerStyle = {
    ...cssVars,
    ...widthStyle,
    ...style,
  };

  return (
    <NavigationMenu value={value} onValueChange={setValue} asChild>
      <header
        {...props}
        style={headerStyle}
        className={cn(
          'rounded-2xl border px-4 py-1 transition-[background-color,box-shadow,transform] duration-300 backdrop-blur-xl shadow-lg shadow-black/5',
          floating
            ? 'fixed left-1/2 top-[--fd-banner-height] z-1001 -translate-x-1/2'
            : 'relative mx-auto w-full',
          isTransparent
            ? 'border-transparent bg-transparent shadow-transparent'
            : 'border border-fd-border/60 bg-white/85 dark:border-white/20 dark:bg-neutral-900/75',
          value.length > 0 &&
            'max-lg:rounded-b-3xl border-fd-border/60 bg-white dark:border-white/20 dark:bg-neutral-900',
          className,
        )}
      >
        <NavigationMenuList
          className="flex w-full items-center gap-4 px-1"
          style={{ height: 'var(--fd-header-height)' }}
          asChild
        >
          <nav>{props.children}</nav>
        </NavigationMenuList>

        <NavigationMenuViewport />
      </header>
    </NavigationMenu>
  );
}

const navItemVariants = cva('[&_svg]:size-4', {
  variants: {
    variant: {
      main: 'inline-flex items-center gap-1 p-2 text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground data-[active=true]:text-fd-primary',
      button: buttonVariants({
        color: 'secondary',
        className: 'gap-1.5',
      }),
      icon: buttonVariants({
        color: 'ghost',
        size: 'icon',
      }),
    },
  },
  defaultVariants: {
    variant: 'main',
  },
});

function NavbarLinkItem({
  item,
  ...props
}: {
  item: ExtendedLinkItem;
  className?: string;
}) {
  if (item.type === 'custom') return <div {...props}>{item.children}</div>;

  if (item.type === 'menu') {
    const children = item.items.map((child, j) => {
      if (child.type === 'custom') {
        return <Fragment key={j}>{child.children}</Fragment>;
      }

      const extendedChild = child as ExtendedLinkItem;

      const {
        banner = child.icon ? (
          <div className="w-fit rounded-md border bg-fd-muted p-1 [&_svg]:size-4">
            {child.icon}
          </div>
        ) : null,
        ...rest
      } = child.menu ?? {};

      return (
        <NavigationMenuLink key={`${j}-${child.url}`} asChild>
          <Link
            href={child.url}
            prefetch={extendedChild.prefetch ?? false}
            external={child.external}
            {...rest}
            className={cn(
              'flex flex-col gap-2 rounded-lg border bg-fd-card p-3 transition-colors hover:bg-fd-accent/80 hover:text-fd-accent-foreground',
              rest.className,
            )}
          >
            {rest.children ?? (
              <>
                {banner}
                <p className="text-[15px] font-medium">{child.text}</p>
                <p className="text-sm text-fd-muted-foreground empty:hidden">
                  {child.description}
                </p>
              </>
            )}
          </Link>
        </NavigationMenuLink>
      );
    });

    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger
          {...props}
          className={cn(navItemVariants(), 'rounded-md', props.className)}
        >
          {item.url ? (
            <Link href={item.url} prefetch={item.prefetch ?? false} external={item.external}>
              {item.text}
            </Link>
          ) : (
            item.text
          )}
        </NavigationMenuTrigger>
        <NavigationMenuContent className="grid grid-cols-1 gap-2 p-4 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <LinkItem
          item={item}
          aria-label={item.type === 'icon' ? item.label : undefined}
          {...props}
          className={cn(
            navItemVariants({ variant: item.type }),
            props.className,
          )}
        >
          {item.type === 'icon' ? item.icon : item.text}
        </LinkItem>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

const Menu = NavigationMenuItem;

function MenuLinkItem({
  item,
  ...props
}: {
  item: ExtendedLinkItem;
  className?: string;
}) {
  if (item.type === 'custom')
    return <div className={cn('grid', props.className)}>{item.children}</div>;

  if (item.type === 'menu') {
    const header = (
      <>
        {item.icon}
        {item.text}
      </>
    );

    return (
      <div className={cn('mb-4 flex flex-col', props.className)}>
        <p className="mb-1 text-sm text-fd-muted-foreground">
          {item.url ? (
            <NavigationMenuLink asChild>
              <Link href={item.url} prefetch={item.prefetch ?? false} external={item.external}>
                {header}
              </Link>
            </NavigationMenuLink>
          ) : (
            header
          )}
        </p>
        {item.items.map((child, i) => (
          <MenuLinkItem key={i} item={child} />
        ))}
      </div>
    );
  }

  return (
    <NavigationMenuLink asChild>
      <LinkItem
        item={item}
        className={cn(
          {
            main: 'inline-flex items-center gap-2 py-1.5 transition-colors hover:text-fd-popover-foreground/50 data-[active=true]:font-medium data-[active=true]:text-fd-primary [&_svg]:size-4',
            icon: buttonVariants({
              size: 'icon',
              color: 'ghost',
            }),
            button: buttonVariants({
              color: 'secondary',
              className: 'gap-1.5 [&_svg]:size-4',
            }),
          }[item.type ?? 'main'],
          props.className,
        )}
        aria-label={item.type === 'icon' ? item.label : undefined}
      >
        {item.icon}
        {item.type === 'icon' ? undefined : item.text}
      </LinkItem>
    </NavigationMenuLink>
  );
}

function MenuTrigger({
  enableHover = false,
  ...props
}: ComponentProps<typeof NavigationMenuTrigger> & {
  enableHover?: boolean;
}) {
  return (
    <NavigationMenuTrigger
      {...props}
      onPointerMove={enableHover ? undefined : (e) => e.preventDefault()}
    >
      {props.children}
    </NavigationMenuTrigger>
  );
}

function MenuContent(
  props: ComponentProps<typeof NavigationMenuContent>,
) {
  return (
    <NavigationMenuContent
      {...props}
      className={cn(
        'flex flex-col p-4 w-full max-w-full min-w-0',
        props.className,
      )}
      style={{ minWidth: 0, width: '100%', maxWidth: '100%', ...props.style }}
    >
      {props.children}
    </NavigationMenuContent>
  );
}

function CompactLanguageToggle({
  contentClassName,
  ...props
}: LanguageSelectProps & { contentClassName?: string }) {
  const context = useI18n();
  if (!context.locales) throw new Error('Missing `<I18nProvider />`');

  return (
    <Popover>
      <PopoverTrigger
        aria-label={context.text.chooseLanguage}
        {...props}
        className={cn(
          buttonVariants({
            color: 'ghost',
            className: 'gap-1.5 py-1.5 px-1',
          }),
          props.className,
        )}
      >
        {props.children}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'flex min-w-[150px] z-1001 flex-col overflow-x-hidden rounded-xl border bg-fd-popover/60 p-0 text-fd-popover-foreground backdrop-blur-lg',
          contentClassName,
        )}
      >
        <p className="mb-1 p-2 text-xs font-medium text-fd-muted-foreground">
          {context.text.chooseLanguage}
        </p>
        {context.locales.map((item) => (
          <button
            key={item.locale}
            type="button"
            className={cn(
              'p-2 text-start text-sm',
              item.locale === context.locale
                ? 'bg-fd-primary/10 font-medium text-fd-primary'
                : 'hover:bg-fd-accent hover:text-fd-accent-foreground',
            )}
            onClick={() => {
              context.onChange?.(item.locale);
            }}
          >
            {item.name}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function isGithubItem(item: ExtendedLinkItem, githubUrl?: string): boolean {
  return Boolean(
    githubUrl && item.type === 'icon' && item.url === githubUrl,
  );
}

function isSecondary(item: ExtendedLinkItem): boolean {
  if ('secondary' in item && item.secondary != null) return item.secondary;

  return item.type === 'icon';
}

function isMobilePinned(item: ExtendedLinkItem): boolean {
  return Boolean((item as { mobilePinned?: boolean }).mobilePinned);
}

function renderNavTitle(title: unknown): ReactNode {
  if (typeof title === 'function') {
    const TitleComponent = title as FC<ComponentProps<'a'>>;
    return <TitleComponent />;
  }

  return (title as ReactNode | null | undefined) ?? null;
}
