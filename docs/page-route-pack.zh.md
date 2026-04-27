# Page Route 函数体积排查总结

本文记录 `apps/ddaas` 在 Vercel 构建后 Page Route Serverless Function 体积偏大的排查过程、关键发现、处理方式、收益，以及当前页面/provider/layout 层次。

## 背景

网站当前的设计背景：

- 使用 `next-intl` 做 i18n 国际化。
- 使用 Clerk 做登录、用户态和用户菜单。
- 使用 `fumadocs-ui` 的部分 UI 能力，例如 home layout、docs layout、导航、TOC、MDX UI 组件。
- 基于 `fumadocs-core` 封装了 `local-md`，用于处理 docs/blog/legal 的 MDX 内容。
- 首页和 pricing 页面需要通用菜单栏、banner、footer 等，但不需要 docs page layout，也不需要 MDX 内容索引。
- 只有 `docs`、`blog`、`legal` 明确需要 Fumadocs docs page layout 和 local-md content source。

Vercel 上看到的现象是：很多普通 Page Route 函数体积很接近，最开始大约都在 `6.32 MiB` 附近，怀疑有公共依赖或文件被打进了所有 Page Route。

## 排查方式

主要看 Next.js 生成的 output file tracing 文件：

```bash
apps/ddaas/.next/server/app/**/page.js.nft.json
apps/ddaas/.next/server/app/**/route.js.nft.json
```

这些 `.nft.json` 文件列出了某个 route 对应的 Serverless Function 运行时会被拷贝进去的文件。

关键点：

- 不能只看 `page.js` 本身体积。
- Vercel 函数体积主要由 `.nft.json` 里 trace 到的文件集合决定。
- `fs`、`process.cwd()`、`readdir`、glob、宽泛 barrel import、provider 默认行为，都会让 tracing 更保守。

每次修改后执行：

```bash
pnpm --filter @windrun-huaiin/ddaas-website build
```

再统计 `.nft.json` 中的文件总大小。

## 关键发现与处理

### 1. build-time 文件被打进 Page Function

以下文件属于构建期、配置、日志、文档或 SQL 文件，不应该进入运行时函数：

```ts
./tsconfig.tsbuildinfo
./tsconfig.json
./tsconfig.node.json
./dev-scripts.config.json
./components.json
./eslint.config.js
./postcss.config.mjs
./next.config.ts
./CHANGELOG.md
./LICENSE
./logs/**/*
./database/**/*
```

典型问题：

- `tsconfig.tsbuildinfo` 单文件约 `588 KiB`，出现在多个函数里。
- `dev-scripts.config.json` 是 build-time 配置，却被 22 个 route trace 到。
- `logs` 和 `database` 目录也因为保守 tracing 被纳入。

原因：

- 部分 server 代码使用了 `process.cwd()`、`fs`、`readdir` 或 glob。
- Next tracing 无法完全判断运行时到底会读哪些文件。
- 因此保守地把 app root 下的一些文件纳入函数。

处理：

在 `apps/ddaas/next.config.ts` 的 `outputFileTracingExcludes` 中排除这些明确不需要的文件。

暂时没有排除：

- `package.json`：文件很小，部分框架/依赖运行时可能读包信息。
- `prisma/schema.prisma`：Prisma 运行时或生成信息可能相关，先不硬排。

### 2. `@third-ui/fuma/server` 大 barrel 混合了不相关 server 能力

原来的 `packages/third-ui/src/fuma/server.ts` 类似：

```ts
export * from './fuma-page-genarator';
export * from './fuma-translate-util';
export * from './llm-copy-handler';
export * from './fuma-banner-suit';
export * from './site-x';
```

问题：

- 根 layout 只需要 `getFumaTranslations`，却通过 `@third-ui/fuma/server` 接触到了 page generator、LLM copy handler 等模块。
- `LLMCopyHandler` 使用 `fs` 读取 MDX 文件。
- `createFumaPage` 使用 docs page、TOC、portable clerk toc 等组件。
- 这些能力不应该共用一个入口。

处理：

拆出具体入口：

```ts
@third-ui/fuma/fuma-translate-util
@third-ui/fuma/server/page-generator
@third-ui/fuma/server/llm-copy-handler
```

当前使用方式：

- 根 layout 从 `@third-ui/fuma/fuma-translate-util` 导入翻译工具。
- docs/blog/legal page 从 `@third-ui/fuma/server/page-generator` 导入 `createFumaPage`。
- LLM content API 从 `@third-ui/fuma/server/llm-copy-handler` 导入 `LLMCopyHandler`。

因为 ddaas 的 tsconfig 有 alias：

```json
"@third-ui/*": ["../../packages/third-ui/src/*"]
```

所以需要源码层 wrapper：

```ts
packages/third-ui/src/fuma/server/page-generator.ts
packages/third-ui/src/fuma/server/llm-copy-handler.ts
```

只保留真实使用的两个 wrapper，不额外预留未使用入口。

### 3. `@third-ui/fuma/base` 把 home layout 和 docs layout 边界混在一起

原问题：

- `SiteHomeLayout`、`SiteDocsLayout`、`DocsRootProvider` 都通过 `@third-ui/fuma/base` 暴露。
- `site-layout.tsx` 同时 import 了 `DocsLayout`、`RootProvider` 和 `CustomHomeLayout`。
- 首页只需要 `SiteHomeLayout`，但模块边界会碰到 docs 相关代码。

处理：

拆成具体模块：

```ts
@third-ui/fuma/base/site-home-layout
@third-ui/fuma/base/site-docs-layout
@third-ui/fuma/base/docs-root-provider
@third-ui/fuma/base/site-layout-shared
@third-ui/fuma/base/nav-config
```

兼容：

- `site-layout.tsx` 保留为兼容 re-export。
- app 代码尽量不要再从 `@third-ui/fuma/base` 大入口导入。

类型冲突处理：

- `ExtendedLinkItem` 只从 `site-layout-shared` 导出。
- `custom-home-layout` 不再导出同名类型，避免 barrel 重复导出歧义。

### 4. `@windrun-huaiin/lib` 根入口非常危险

原来的根入口：

```ts
export * from './utils';
export * from './llm-utils';
export * from './common-app-config';
```

问题：

- 首页相关代码只想用 `cn` 或 `getAsNeededLocalizedUrl`。
- 但有一些代码从 `@windrun-huaiin/lib` 根入口导入。
- 根入口导出了 `llm-utils`。
- `llm-utils` 引入了 `remark`、`remark-gfm`、`remark-mdx`、`remark-frontmatter`、`micromark`、`unified` 等完整 markdown parser 链。
- 结果首页函数里多了约 `420 KiB` 的 markdown parser runtime。

处理：

移除根入口中的 `llm-utils`：

```ts
// packages/lib/src/index.ts
export * from './utils';
export * from './common-app-config';
```

使用显式子路径：

```ts
import { cn, getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
import { getLLMText } from '@windrun-huaiin/lib/llm-utils';
```

当前规则：

- `@windrun-huaiin/lib` 根入口必须保持轻量。
- 任何 parser、LLM、文件系统、MDX 处理能力，都必须通过明确子路径导入。

### 5. Fumadocs `RootProvider` 默认带入 Search

Fumadocs provider 内部有类似代码：

```ts
const DefaultSearchDialog = lazy(() => import("../components/dialog/search-default.js"));
```

即使页面 layout 设置了：

```ts
searchToggle: { enabled: false }
```

只要 import `fumadocs-ui/provider/next`，模块顶层仍然存在 `search-default` 的 lazy import，Next tracing 会把它纳入函数。

被带入的内容包括：

```txt
fumadocs-ui/components/dialog/search-default
fumadocs-core/search/client
parse5 / hast / rehype 相关依赖
```

处理：

`packages/third-ui/src/fuma/base/docs-root-provider.tsx` 不再使用：

```ts
fumadocs-ui/provider/next
```

改为 third-ui 自己控制 provider 组合：

```tsx
<NextProvider>
  <I18nProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </I18nProvider>
</NextProvider>
```

不挂 `SearchProvider`。

说明：

- 没有直接引入 `DirectionProvider`，因为 `@radix-ui/react-direction` 不是 third-ui 的直接依赖。
- 当前站点是 LTR，不影响功能。
- 如果后续需要 RTL，应该显式增加依赖并有意识地恢复 direction provider。

## 普通页面中移除的非必要包/模块

首页和 pricing 不再包含这些大块：

- `remark`
- `remark-gfm`
- `remark-mdx`
- `micromark`
- `unified`
- `fumadocs-ui/components/dialog/search-default`
- `fumadocs-core/search/client`
- build-time 配置、日志、SQL、tsbuildinfo 等文件

普通页面仍然合理保留的主要体积来源：

- Next App Router runtime
- Clerk/auth runtime
- Fingerprint provider/runtime
- Fumadocs home/nav 组件
- Base UI icons
- Framer Motion
- Radix popover/dropdown primitives
- i18n runtime/messages

## 总体收益

首页 Page Route trace 大致变化：

| 阶段 | 首页 trace 体积 | 说明 |
|---|---:|---|
| 初始状态 | `~5.66 MiB` | build 文件、MDX 元数据、barrel、provider 默认行为混在一起 |
| 排除 build/config/log 文件，避开 `fuma/server` 翻译 barrel | `~3.94 MiB` | 移除大量误 trace 文件 |
| 拆分 `fuma/base` home/docs 入口 | `~3.88 MiB` | 体积收益小，但边界更干净 |
| 移除 `@windrun-huaiin/lib` 根入口的 LLM/remark 污染 | `~3.46 MiB` | 移除 markdown parser 大链路 |
| 替换 Fumadocs `RootProvider`，不再挂 search | `~3.04 MiB` | 移除 Fumadocs search/default chunks |

当前检查结果：

| Route | trace 体积 | search trace |
|---|---:|---:|
| `/[locale]` 首页 | `~3.04 MiB` | `0` |
| `/[locale]/pricing` | `~3.39 MiB` | `0` |
| `/[locale]/docs/[...slug]` | `~22.27 MiB` | `0` |

内容页仍然大，是因为它们确实需要 local-md source artifacts 和 MDX 内容索引。

## 当前 Page / Provider / Layout 层次

根 locale layout：

```tsx
<html lang={locale}>
  <NextIntlClientProvider messages={messages}>
    <body className={montserrat.className}>
      <NProgressBar />
      <ClerkProviderClient>
        <DocsRootProvider>
          {children}
        </DocsRootProvider>
      </ClerkProviderClient>
    </body>
  </NextIntlClientProvider>
</html>
```

现在的 `DocsRootProvider` 是 third-ui 自己控制的轻量 provider，不再是 Fumadocs 原始全量 RootProvider：

```tsx
<NextProvider>
  <I18nProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </I18nProvider>
</NextProvider>
```

默认不挂 `SearchProvider`。

首页 route group：

```tsx
<FingerprintProvider>
  <SiteHomeLayout>
    {children}
  </SiteHomeLayout>
</FingerprintProvider>
```

首页布局包含：

- 自定义 navbar/header
- 通用 banner
- footer
- go-to-top
- theme switch
- i18n switch
- Clerk 用户入口
- credit nav 自定义入口

Docs route group：

```tsx
<SiteDocsLayout>
  {children}
</SiteDocsLayout>
```

Blog/legal 内容 route group：

```tsx
<SiteHomeLayout>
  <SiteDocsLayout>
    {children}
  </SiteDocsLayout>
</SiteHomeLayout>
```

这样可以保留统一菜单栏和 banner，同时只有 docs/blog/legal 使用 docs page layout 和 local-md source tree。

## 后续边界规则

有明显运行时重量的能力必须使用具体子路径。

推荐：

```ts
@windrun-huaiin/lib/utils
@windrun-huaiin/lib/llm-utils
@third-ui/fuma/base/site-home-layout
@third-ui/fuma/base/site-docs-layout
@third-ui/fuma/base/docs-root-provider
@third-ui/fuma/server/page-generator
@third-ui/fuma/server/llm-copy-handler
```

普通 page/layout 中避免：

```ts
@windrun-huaiin/lib
@third-ui/fuma/server
@third-ui/fuma/base
fumadocs-ui/provider/next
```

只有当站点明确需要 Fumadocs 默认 search provider，并接受对应函数体积成本时，才考虑使用 `fumadocs-ui/provider/next`。

## 回归检查

构建：

```bash
pnpm --filter @windrun-huaiin/ddaas-website build
```

然后检查首页 `.nft.json`：

- 不应出现 `search-default`
- 不应出现 `fumadocs-core_dist_search`
- 不应出现大块 `remark/micromark/unified`
- 不应出现 `tsconfig.tsbuildinfo`
- 不应出现 `logs/**/*`
- 不应出现 `dev-scripts.config.json`

如果再次出现，优先检查：

- 是否新增了根 barrel import。
- 是否从 `@windrun-huaiin/lib` 根入口导入了工具。
- 是否重新使用了 `@third-ui/fuma/server` 或 `@third-ui/fuma/base`。
- 是否重新引入了 `fumadocs-ui/provider/next`。

## 经验总结：如何写出正确的边界代码

这次最大的经验是：代码组织边界和运行时打包边界不是一回事。

barrel export 写起来很方便，但它本质上也是依赖边界。一个轻量工具函数和一个重型运行时模块如果放在同一个根入口里，任何只想用轻量工具的页面，都可能被迫带上重型模块。

### 边界原则

根入口应该无聊、稳定、轻量。

适合放在根入口的内容：

- 纯工具函数
- 小型配置 helper
- type-only export
- 不依赖 fs、parser、auth、search、database、SDK、provider 副作用的模块

不适合放在根入口的内容：

- Markdown/MDX parser
- search engine 或 search dialog
- 文件系统读取逻辑
- 数据库 client
- auth SDK
- payment SDK
- Prisma generated client
- 会默认挂很多行为的 provider
- 会引入大型 UI 体系的组件

重能力应该用明确子路径：

```ts
@windrun-huaiin/lib/utils
@windrun-huaiin/lib/llm-utils
@third-ui/fuma/server/page-generator
@third-ui/fuma/server/llm-copy-handler
```

### 如何判断“按需”

“按需”不是指功能在 UI 上隐藏了，也不是指传了一个 `enabled: false`。

真正的按需是：某个 route 只有在运行时确实需要这个能力时，才 import 到对应模块。

例如这样不一定能保证打包按需：

```tsx
searchToggle={{ enabled: false }}
```

如果 provider 模块顶层已经 import 或 lazy import 了 search，那么即使运行时关闭，Next tracing 仍然可能把 search 打进去。

判断一个能力是否真的按需，可以问这些问题：

1. 这个 route 渲染或响应请求时，真的需要这个能力吗？
2. import path 是否明确指向这个能力？
3. 这个模块顶层是否 import 了其他无关能力？
4. provider 是否默认挂载了 route 不需要的功能？
5. 如果首页 import 这个模块，会不会带上 docs、search、parser、auth、database、fs 等代码？

如果第 3、4、5 条答案是“会”，那就不是真正的按需边界。

### 实践规则

route/layout 代码里优先使用具体入口：

```ts
import { SiteHomeLayout } from '@third-ui/fuma/base/site-home-layout';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib/utils';
```

避免在 route/layout 里使用宽入口：

```ts
import { SiteHomeLayout } from '@third-ui/fuma/base';
import { getAsNeededLocalizedUrl } from '@windrun-huaiin/lib';
```

不要把 `enabled: false` 当成打包层面的保证。它只代表运行时行为，不代表 import 边界已经隔离。

封装第三方 provider 时，不要无脑套 all-in-one provider。应该重新组合站点实际需要的最小上下文。

这个站点的正确方式是：

- 使用 Fumadocs 的基础 context 和基础组件。
- 不使用 Fumadocs 默认 search provider。
- docs layout 只放在 docs/blog/legal route group。
- LLM/MDX parser 只出现在 LLM API 和内容页相关路径。

### 新代码 review 清单

新增 shared export 或 provider 前，先检查：

- 这个模块被首页 import 时，会不会拉入非首页能力？
- 这个入口是否同时导出了“轻工具”和“重运行时”？
- server-only 工具是否和 client UI 组件混在一起？
- docs/search/MDX/parser 是否和 navbar/home layout 混在一起？
- 普通 page layout 是否能触达 `fs` 或 `process.cwd()` 模块？
- provider 是否在模块顶层 import 了可选功能？
- 这个功能是否应该移动到具体子路径入口？

如果一个模块确实很重但业务需要，就让它的 import path 显式表达成本。读到 import 的人应该能看出自己正在选择哪个运行时能力。
