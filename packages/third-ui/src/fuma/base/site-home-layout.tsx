import type { ReactNode } from 'react';
import {
  CustomHomeLayout,
  type CustomHomeLayoutProps,
  type HeaderActionOrders,
} from './custom-home-layout';
import {
  toHomeLayoutOptions,
  type SiteBaseLayoutConfig,
} from './site-layout-shared';

export interface SiteHomeLayoutConfig extends SiteBaseLayoutConfig {
  showBanner?: boolean;
  bannerHeight?: number;
  headerHeight?: number;
  headerPaddingTop?: number;
  navbarClassName?: string;
  floatingNav?: boolean;
  banner?: ReactNode;
  footer?: ReactNode;
  goToTop?: ReactNode;
  showFooter?: boolean;
  showGoToTop?: boolean;
  actionOrders?: HeaderActionOrders;
  localePrefixAsNeeded?: boolean;
  defaultLocale?: string;
}

export function SiteHomeLayout({
  locale,
  config,
  children,
}: {
  locale: string;
  config: SiteHomeLayoutConfig;
  children: ReactNode;
}) {
  const {
    actionOrders,
    banner,
    bannerHeight,
    defaultLocale,
    floatingNav,
    footer,
    goToTop,
    headerHeight,
    headerPaddingTop,
    localePrefixAsNeeded,
    navbarClassName,
    showBanner,
    showFooter,
    showGoToTop,
    ...baseConfig
  } = config;

  const options = toHomeLayoutOptions(baseConfig);

  const layoutProps: CustomHomeLayoutProps = {
    locale,
    options,
    ...(actionOrders ? { actionOrders } : {}),
    ...(banner ? { banner } : {}),
    ...(bannerHeight != null ? { bannerHeight } : {}),
    ...(defaultLocale ? { defaultLocale } : {}),
    ...(floatingNav != null ? { floatingNav } : {}),
    ...(footer ? { footer } : {}),
    ...(goToTop ? { goToTop } : {}),
    ...(headerHeight != null ? { headerHeight } : {}),
    ...(headerPaddingTop != null ? { headerPaddingTop } : {}),
    ...(localePrefixAsNeeded != null ? { localePrefixAsNeeded } : {}),
    ...(navbarClassName ? { navbarClassName } : {}),
    ...(showBanner != null ? { showBanner } : {}),
    ...(showFooter != null ? { showFooter } : {}),
    ...(showGoToTop != null ? { showGoToTop } : {}),
  };

  return <CustomHomeLayout {...layoutProps}>{children}</CustomHomeLayout>;
}
