
import { appConfig } from "@/lib/appConfig";
import { buildProtectedPageRoutePatterns, handleAuthMiddleware } from "@windrun-huaiin/backend-core/auth/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales: appConfig.i18n.locales,
  defaultLocale: appConfig.i18n.defaultLocale,
  localePrefix: appConfig.i18n.localePrefixAsNeeded ? "as-needed" : "always", 
  localeDetection: false
});

// 需要身份认证的路由（页面路由）
const protectedPageRoutes = createRouteMatcher(
  buildProtectedPageRoutePatterns(
    ['/dashboard', '/settings', '/profile', '/billing'],
    appConfig.i18n.locales
  )
);

// 需要身份认证的API路由
const protectedApiRoutes = createRouteMatcher([
  // Stripe支付相关API
  '/api/stripe(.*)',
  // 积分相关API  
  '/api/credit(.*)',
  // 交易记录API
  '/api/transaction(.*)'
]);

// 免认证的API路由（webhook、匿名用户初始化等）
const publicApiRoutes = createRouteMatcher([
  // Stripe webhook
  '/api/webhook/stripe',
  // Clerk webhook
  '/api/webhook/clerk/user',
  // 匿名用户初始化
  '/api/user/anonymous/init',
  // 健康检查等
  '/api/health',
  '/api/legal',
  '/api/docs',
  '/api/search',
  '/api/blog'
]);

// v6 官方推荐写法：直接 export default clerkMiddleware(handler, options)
// 完全不需要再包一层函数，也不需要手动 (req)
export default clerkMiddleware(
  async (auth, req: NextRequest) => {
    const { defaultLocale, locales } = appConfig.i18n;
    const pathname = req.nextUrl.pathname;
    const isWellKnownPath =
      pathname === '/.well-known' || pathname.startsWith('/.well-known/');
    const hasLocalePrefix = locales.some(
      (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
    );

    if (isWellKnownPath) {
      return NextResponse.next();
    }

    const authResponse = await handleAuthMiddleware(auth, req, {
      protectedPageRoutes,
      protectedApiRoutes,
      publicApiRoutes,
      intlMiddleware,
    });
    if (authResponse) {
      return authResponse;
    }

    // 对于无语言前缀的页面请求，根据配置进行处理
    // 避免落不到 [locale] 路由。
    if (!hasLocalePrefix && !pathname.startsWith('/api/')) {
      const url = req.nextUrl.clone();
      url.pathname = `/${defaultLocale}${pathname}`;

      if (appConfig.i18n.localePrefixAsNeeded) {
        return NextResponse.rewrite(url);
      } else {
        return NextResponse.redirect(url);
      }
    }

    // 5. 其他路由使用默认的国际化中间件处理

    // handle trailing slash redirect
    if (req.nextUrl.pathname.length > 1 && req.nextUrl.pathname.endsWith("/")) {
      return NextResponse.redirect(
        new URL(req.nextUrl.pathname.slice(0, -1), req.url),
        301
      );
    }
    // 默认处理其他路由（公开页面路由）
    return intlMiddleware(req);
  },
  { debug: appConfig.clerk.debug }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, but include API routes
    "/((?!_next|\\.well-known|sitemap.xml?|robots.txt?|[^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Include API routes explicitly
    "/api/(.*)",
  ],
};
