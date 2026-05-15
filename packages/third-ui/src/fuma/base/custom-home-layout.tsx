import type { CSSProperties, ReactNode } from 'react';
import { HomeLayout, type HomeLayoutProps } from 'fumadocs-ui/layouts/home';
import { FumaBannerSuit } from '../fuma-banner-suit';
import { Footer } from '../../main/footer';
import { GoToTop } from '../../main/go-to-top';
import {
  NavbarCSSVars,
  CustomHomeHeader,
  type DesktopAction,
  type MobileBarAction,
  type MobileMenuAction,
} from './custom-header';

// - Set bannerHeight/headerHeight to the rem values expected by the project. Use bannerHeight = 0 when there is no banner.
// - layoutStyle passes the variables to HomeLayout's main element, offsetting content without has-banner/no-banner classes.
// - CustomHomeHeader accepts HomeLayout props such as links, nav, searchToggle, themeSwitch, and i18n, then reuses Fumadocs navigation behavior.
// - The banner can still use FumaBannerSuit or any custom banner component. Header positioning and z-index are already handled; the toggle only affects bannerHeight.

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
  /**
   * Whether localePrefix is set to 'as-needed' (default: true)
   */
  localePrefixAsNeeded?: boolean;
  /**
   * The default locale for the application (default: 'en')
   */
  defaultLocale?: string;
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
  localePrefixAsNeeded = true,
  defaultLocale = 'en',
}: CustomHomeLayoutProps) {
  const resolvedBannerHeight = bannerHeight ?? (showBanner ? 3 : 0.5);
  const resolvedPaddingTop =
    headerPaddingTop ?? (showBanner ? 0 : 0.5);

  const layoutStyle: NavbarCSSVars = {
    '--fd-banner-height': `${resolvedBannerHeight}rem`,
    '--fd-header-height': `${headerHeight}rem`,
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
          {showFooter ? footer ?? <Footer locale={locale} localePrefixAsNeeded={localePrefixAsNeeded} defaultLocale={defaultLocale} /> : null}
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
