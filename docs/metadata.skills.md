# metadata skills

这套 `metadata` 方案用于统一生成页面 SEO 信息，重点解决：

- 首页兜底 metadata
- 子页面 canonical 正确
- 多语言 `alternates.languages`
- 翻译覆盖式配置
- `openGraph` / `twitter` 图片与站点信息

## 使用方式

页面里直接调用底层包：

```ts
import { createLocalizedMetadata } from '@windrun-huaiin/third-ui/lib/seo-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return createLocalizedMetadata({
    namespace: 'metadata.pricing',
    url: {
      locale,
      pathname: '/pricing',
      baseUrl: appConfig.baseUrl,
      locales: appConfig.i18n.locales,
      defaultLocale: appConfig.i18n.defaultLocale,
      localePrefixAsNeeded: appConfig.i18n.localePrefixAsNeeded,
    },
  });
}
```

根 layout 也要配合改造。当前项目里实际使用的是下面这套写法：

```ts
import { createLocalizedPageMetadata, createLocalizedSiteMetadata } from '@windrun-huaiin/third-ui/lib/seo-metadata';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const siteMetadata = await createLocalizedSiteMetadata({
    locale,
    baseUrl: appConfig.baseUrl,
    locales: appConfig.i18n.locales,
    defaultLocale: appConfig.i18n.defaultLocale,
    localePrefixAsNeeded: appConfig.i18n.localePrefixAsNeeded,
  });

  return createLocalizedPageMetadata({
    url: {
      locale,
      pathname: '/',
      baseUrl: appConfig.baseUrl,
      locales: appConfig.i18n.locales,
      defaultLocale: appConfig.i18n.defaultLocale,
      localePrefixAsNeeded: appConfig.i18n.localePrefixAsNeeded,
    },
    site: siteMetadata,
  });
}
```

根 layout 的作用是：

- 提供站点默认 metadata
- 作为首页兜底
- 默认站点翻译 key 来自 `home`
- 不要替所有子页面固定输出首页 canonical

## 翻译规则

翻译文件放在 `messages/biz/*.json`，只要不同文件的 key 不重复就会合并。

示例：

```json
{
  "metadata": {
    "pricing": {
      "title": "Pricing - DDaaS",
      "description": "Compare plans.",
      "keywords": "pricing, saas",
      "openGraph": {
        "image": "/og/pricing.png"
      },
      "twitter": {
        "image": "/og/pricing.png"
      }
    }
  }
}
```

页面级还有一条默认规则：

- `metadata.pricing.title` 会默认作为 `openGraph.title` 和 `twitter.title`
- `metadata.pricing.description` 会默认作为 `openGraph.description` 和 `twitter.description`
- 只有显式写了 `openGraph.title` / `twitter.title` 这类字段时，才会覆盖页面默认值

所以大多数页面只需要写一次 `title` / `description`，不需要重复写三遍。

## 兜底规则

- 页面翻译为空时，会回退到根站点 metadata
- `title` / `description` / `keywords` 支持覆盖
- 页面级 `openGraph.title` / `twitter.title` 默认回退到页面自己的 `title`
- 页面级 `openGraph.description` / `twitter.description` 默认回退到页面自己的 `description`
- `openGraph.image` / `twitter.image` 支持单图
- 图片可以写绝对 URL，也可以写 `public/` 下的站内路径
- `NEXT_PUBLIC_OG_TYPE` 为空时不输出 `og:type`
- `NEXT_PUBLIC_X_SITE_NAME` 为空时不输出 `twitter:site`

## 推荐约定

- 首页用 `pathname: '/'`
- 普通页面用实际路径，如 `/pricing`
- page metadata 统一走 `createLocalizedMetadata`
- 不要在根 layout 里固定写首页 canonical
