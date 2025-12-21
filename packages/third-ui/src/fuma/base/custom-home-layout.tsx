import type { CSSProperties, ReactNode } from 'react';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { type LinkItemType } from 'fumadocs-ui/layouts/docs';
import { FumaBannerSuit } from '@third-ui/fuma/fuma-banner-suit';
import { Footer } from '@third-ui/main/footer';
import { GoToTop } from '@third-ui/main/go-to-top';
import {
  NavbarCSSVars,
  CustomHomeHeader,
  type DesktopAction,
  type MobileBarAction,
  type MobileMenuAction,
} from './custom-header';

export type ExtendedLinkItem = LinkItemType & { mobilePinned?: boolean };

// - bannerHeight/headerHeight 换成你项目期望的 rem 值即可（如果没有 Banner 就把 bannerHeight 设成 0）。
// - layoutStyle 同时把变量传给 HomeLayout 的 main 元素，这样内容整体会往下错开，不需要 has-banner/no-banner class。
// - CustomHomeHeader 直接接受 HomeLayout 的各类 props（links、nav、searchToggle、themeSwitch、i18n 等），内部会复用 Fumadocs 原本的导航功能。
// - Banner 部分仍然可以用你现有的 FumaBannerSuit（或者任何自定义 Banner 组件），因为 Header 是固定定位、z-index 也处理好了，开关只影响 bannerHeight。

export interface CustomHomeLayoutProps {
  locale: string;
  options: HomeLayoutProps;
  /**
   * Toggle the banner rendered above the navbar.
   *
   * @defaultValue false
   */
  showBanner?: boolean;
  /**
   * Override banner height in rem.
   * Defaults to `3` when banner is shown, otherwise `0.5`.
   */
  bannerHeight?: number;
  /**
   * Header height in rem units.
   *
   * @defaultValue 2.5
   */
  headerHeight?: number;
  /**
   * Extra padding (in rem) applied on top of the main content after banner height.
   * Defaults to `0` when banner is shown, otherwise `0.5`.
   */
  headerPaddingTop?: number;
  /**
   * Extra classes for the navbar surface.
   */
  navbarClassName?: string;
  /**
   * Whether the header floats independently of the page flow.
   *
   * @defaultValue false
   */
  floatingNav?: boolean;
  /**
   * Custom banner component. Pass `null` to render nothing.
   */
  banner?: ReactNode;
  /**
   * Custom footer component.
   */
  footer?: ReactNode;
  /**
   * Custom GoToTop component.
   */
  goToTop?: ReactNode;
  /**
   * Toggle Footer visibility.
   *
   * @defaultValue true
   */
  showFooter?: boolean;
  /**
   * Toggle GoToTop visibility.
   *
   * @defaultValue true
   */
  showGoToTop?: boolean;
  /**
   * Additional styles merged on top of the computed layout style.
   */
  style?: CSSProperties;
  /**
   * Customize the order of header action items.
   */
  actionOrders?: HeaderActionOrders;
  children?: ReactNode;
}

export interface HeaderActionOrders {
  desktop?: DesktopAction[];
  mobileBar?: MobileBarAction[];
  mobileMenu?: MobileMenuAction[];
}

export function CustomHomeLayout({
  locale,
  options,
  children,
  showBanner = false,
  bannerHeight,
  headerHeight = 2.5,
  headerPaddingTop,
  navbarClassName,
  banner,
  footer,
  goToTop,
  showFooter = true,
  showGoToTop = true,
  style,
  floatingNav = false,
  actionOrders,
}: CustomHomeLayoutProps) {
  const resolvedBannerHeight = bannerHeight ?? (showBanner ? 3 : 0.5);
  const resolvedPaddingTop =
    headerPaddingTop ?? (showBanner ? 0 : 0.5);

  const layoutStyle: NavbarCSSVars = {
    '--fd-banner-height': `${resolvedBannerHeight}rem`,
    '--fd-nav-height': `${headerHeight}rem`,
    paddingTop: floatingNav
      ? `calc(var(--fd-banner-height) + ${resolvedPaddingTop}rem)`
      : `${resolvedPaddingTop}rem`,
    ...style,
  };

  const { nav, ...homeLayoutProps } = options;
  const navOptions = nav ?? {};
  const header = (
    <CustomHomeHeader
      {...homeLayoutProps}
      nav={navOptions}
      bannerHeight={resolvedBannerHeight}
      headerHeight={headerHeight}
      navbarClassName={navbarClassName}
      floating={floatingNav}
      desktopActionsOrder={actionOrders?.desktop}
      mobileBarActionsOrder={actionOrders?.mobileBar}
      mobileMenuActionsOrder={actionOrders?.mobileMenu}
    />
  );

  return (
    <>
      {banner ?? (
        <FumaBannerSuit
          locale={locale}
          showBanner={showBanner}
          floating={floatingNav}
        />
      )}
      <HomeLayout
        {...homeLayoutProps}
        nav={{
          ...navOptions,
          component: header,
        }}
        className='bg-neutral-100 dark:bg-neutral-900'
        style={layoutStyle}
      >
        {children}
        {showFooter ? footer ?? <Footer locale={locale} /> : null}
        {showGoToTop ? goToTop ?? <GoToTop /> : null}
      </HomeLayout>
    </>
  );
}

export function HomeTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-medium in-[.uwu]:hidden in-[header]:text-[clamp(12px,3vw,15px)]! ${className ?? ''}`}
    >
      {children}
    </span>
  );
}
