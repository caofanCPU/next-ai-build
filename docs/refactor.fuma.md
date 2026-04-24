# Fuma Refactor Plan

## Background

当前 `ddaas` 对 `fumadocs-*` 仍然存在直接依赖，主要体现在两类问题：

1. 布局与 Provider 直接依赖 `fumadocs-ui`
2. MDX 解析与渲染能力分散在应用层、`local-md`、`third-ui`，且缺少可裁剪边界

这带来了几个持续性问题：

- `fumadocs` 版本升级会直接冲击 `ddaas`
- `ddaas` 中存在过多 `fumadocs-*` 类型、组件、导入路径
- MDX 相关能力默认偏“大而全”，不利于按需裁剪
- 将来如果替换 docs 框架，应用层改动面会过大

本次重构的目标不是立即升级 `fumadocs`，而是先建立稳定的内部适配层，降低后续升级和替换框架的成本。

## Goals

- 将 `ddaas` 对 `fumadocs-*` 的直接依赖尽量下沉到 `third-ui` 和 `local-md`
- 让 `ddaas` 只依赖内部稳定接口，不再直接依赖 Fuma 的 Provider、Layout、MDX 组件和解析能力
- 将 MDX 解析能力沉淀到 `local-md`
- 支持根据上层应用需求对 MDX 能力做配置化裁剪
- 为后续升级到 `fumadocs 16.8.x` 建立缓冲层
- 保留未来替换 docs 框架或自行实现 docs 系统的可能性

## Non-Goals

- 本阶段不直接升级到 `fumadocs 16.8.x`
- 本阶段不追求彻底去除 monorepo 中所有 `fumadocs-*` 依赖
- 本阶段不一次性重写现有 docs UI 和布局

## Target Architecture

### 1. `packages/local-md`

职责定位：内容系统内核。

负责：

- 本地内容源读取
- frontmatter / meta schema
- Markdown / MDX 编译
- remark / rehype / shiki / math / mermaid 等解析能力
- TOC / structured data / renderer context
- feature / preset 能力编排

不负责：

- 整站布局
- Fuma 页面框架
- Header / Sidebar / Provider 之类的站点 UI 外壳

对上层暴露：

- 稳定的内容接口
- feature 配置接口
- preset 接口

### 2. `packages/third-ui`

职责定位：文档 UI 与站点布局适配层。

负责：

- Fuma Provider 封装
- Home / Docs / Blog / Legal 等页面布局封装
- Header / Banner / Footer / Sidebar / TOC 等站点 UI
- MDX 展示组件封装
- Fuma 布局类型、组件和上下文的内部适配

不负责：

- 重型 MDX 编译链路
- 内容源扫描与解析

对上层暴露：

- 根壳层组件
- 页面布局组件
- 稳定的布局配置模型
- 可选的 MDX 展示组件入口

### 3. `apps/ddaas`

职责定位：业务编排层。

负责：

- 站点配置
- 菜单配置
- 路由与 source 目录组织
- 业务组件注入
- 选择启用哪些 MDX feature / preset

不再直接负责：

- `RootProvider`
- `DocsLayout`
- `HomeLayoutProps`
- `DocsLayoutProps`
- `remarkMath` / `rehypeKatex` / `shiki` 等解析能力导入
- `fumadocs-ui/components/*` 直接使用

## Core Principle

应用层不应直接感知 `fumadocs-*`。

`ddaas` 未来应该只依赖：

- `local-md` 的内容能力接口
- `third-ui` 的 UI / layout / provider 接口

而不直接依赖：

- `fumadocs-core`
- `fumadocs-ui`
- `fumadocs-typescript`
- `fumadocs-mdx`
- 各类 `remark-*` / `rehype-*` / `shiki`

## Current Problem Mapping

### A. Layout / Provider

当前 `ddaas` 中仍直接依赖：

- `apps/ddaas/src/app/[locale]/layout.tsx`
- `apps/ddaas/src/app/[locale]/layout.config.tsx`
- `apps/ddaas/src/app/[locale]/(home)/layout.tsx`
- `apps/ddaas/src/app/[locale]/(content)/layout.tsx`
- `apps/ddaas/src/app/[locale]/(clerk)/layout.tsx`
- `apps/ddaas/src/app/[locale]/docs/layout.tsx`
- `apps/ddaas/src/app/[locale]/(content)/blog/layout.tsx`
- `apps/ddaas/src/app/[locale]/(home)/legal/layout.tsx`

主要问题：

- `RootProvider` 仍直接出现在应用根布局
- `HomeLayoutProps` / `DocsLayoutProps` 仍直接暴露到应用层
- `DocsLayout` 仍在应用层直接使用
- `layout.config.tsx` 中的菜单配置已经掺入 Fuma 的类型和数据协议

### B. MDX Parsing / Rendering

当前问题分布：

- `local-md` 已承载部分编译逻辑，但仍是偏基础能力
- `ddaas` 仍在 `local-md-source.ts` 中自行拼装 math / code / npm / steps / shiki 等能力
- `ddaas` 的 `mdx-components.tsx` 仍直接依赖 `fumadocs-ui` 和 `fumadocs-typescript`
- `third-ui` 中的 `fuma/mdx` 仍存在总入口式导出，容易放大打包范围

结论：

- 解析能力没有完全下沉到 `local-md`
- 渲染能力没有完全下沉到 `third-ui`
- 应用层仍直接拼装了大量 Fuma 和 MDX 细节

## Refactor Direction

## 1. Layout / Provider 下沉方案

### Root Provider 不应沉到 `CustomHomeLayout`

`RootProvider` 是全局 provider，不是 Home 页面布局的一部分。

因此不建议：

- 把 `RootProvider` 塞进 `CustomHomeLayout`

更合理的做法：

- 在 `third-ui` 新增根壳层组件
- 由它统一封装 `RootProvider` 和相关 docs runtime provider

建议新增的抽象：

- `SiteRootProviders`
- 或 `DocsRootShell`
- 或 `FumaAppProvider`

该组件内部负责：

- `RootProvider`
- Fuma i18n translations 对接
- 站点级 docs runtime 配置

应用层只传：

- locale
- locales
- translations
- 需要的其他全局 provider 参数

### Home Layout 下沉

将现有：

- `CustomHomeLayout`
- `homeOptions`
- `baseOptions + links + themeSwitch + searchToggle`

进一步收口为 `third-ui` 内部稳定接口。

建议方向：

- `MarketingLayout`
- `ContentLayout`
- `AuthLayout`

或保留一个更通用的：

- `SiteHomeLayout`

应用层只传：

- 菜单配置
- 标题和品牌配置
- banner 开关
- footer / gotoTop 开关
- action order
- 少量业务组件插槽

不再传递：

- `HomeLayoutProps`
- Fuma 特定配置结构

### Docs Layout 下沉

将现有：

- `DocsLayout`
- `DocsLayoutProps`

封装为内部布局组件，例如：

- `DocsPageLayout`
- `SimpleDocsLayout`

应用层只传：

- `tree`
- `sidebarEnabled`
- `searchEnabled`
- 顶部额外 actions
- 少量站点配置

不再直接依赖 Fuma 的 docs layout 组件和类型。

### 配置模型去 Fuma 化

`layout.config.tsx` 当前虽然看起来像配置文件，但已混入大量 Fuma 协议，例如：

- `BaseLayoutProps`
- `type: 'menu' | 'custom'`
- `secondary`
- `mobilePinned`
- `menu.items`

目标是让应用层只保留站点配置模型，例如：

- brand
- nav groups
- nav actions
- github
- i18n
- banner
- header behavior

再由 `third-ui` 内部将该配置转换成 Fuma 所需的数据结构。

## 2. MDX 解析与裁剪方案

### 核心原则

MDX 裁剪必须同时覆盖两层：

1. 解析能力裁剪
2. 渲染能力裁剪

如果只裁一层，不足以真正控制依赖范围和最终产物体积。

### 解析能力下沉到 `local-md`

建议把以下内容尽量收敛到 `local-md`：

- `remark-*`
- `rehype-*`
- `@mdx-js/*`
- `shiki`
- `remark-math`
- `rehype-katex`
- mermaid 相关解析能力
- toc / structuredData / code transform

应用层不再直接 import 这些依赖。

### 渲染能力沉到 `third-ui`

`third-ui` 负责：

- `Mermaid`
- `MathBlock`
- `InlineMath`
- `CodeBlock`
- `Callout`
- `Tabs`
- `Files`
- `ImageZoom`
- `TypeTable`

以及相关展示层组件的风格封装。

### 不再使用单一大入口

当前的大一统总入口不利于裁剪。

后续应改为按 feature 分模块出口，而不是一个总入口把所有高级能力全部顶层导出。

建议结构：

`local-md`

- `local-md/core`
- `local-md/features/base`
- `local-md/features/code`
- `local-md/features/math`
- `local-md/features/mermaid`
- `local-md/features/type-table`
- `local-md/presets/base`
- `local-md/presets/docs`
- `local-md/presets/full`

`third-ui`

- `third-ui/mdx-base`
- `third-ui/mdx-code`
- `third-ui/mdx-math`
- `third-ui/mdx-mermaid`
- `third-ui/mdx-type-table`

### Feature 必须模块化，而不是只有布尔配置

仅有：

```ts
featureX: false
```

只代表运行时不启用，不代表构建时一定能裁掉。

要尽量让打包裁剪生效，必须做到：

- feature 独立模块
- 基础入口不顶层 import 全部 feature
- 避免 barrel 文件一次性 re-export 所有能力

### 建议的能力分层

#### Base

始终可用，且不应依赖重型能力：

- 基础 markdown 元素渲染
- 标题、段落、列表、表格、blockquote、a
- 图片
- 基础 toc / heading 支持
- 基础 frontmatter/schema

#### Optional

按需启用：

- code / shiki
- math / katex
- mermaid
- type-table
- npm/install
- steps
- 其他文档作者增强能力

## Suggested Public API Shape

### `local-md`

建议暴露你自己的稳定接口，而不是 Fuma 接口。

例如：

- `createContentSource`
- `createMdxPipeline`
- `createMdxPreset`
- `createMdxFeatureSet`
- `createMdxRenderer`

### `third-ui`

建议暴露：

- `SiteRootProviders`
- `SiteHomeLayout`
- `DocsPageLayout`
- `SimpleDocsLayout`
- `createSiteLayoutConfig`
- `getMdxComponents`

应用层不再直接使用：

- `RootProvider`
- `DocsLayout`
- `HomeLayoutProps`
- `DocsLayoutProps`

## Execution Plan

本次重构按两阶段执行。

原则：

- 阶段 1 一次性完成 `ddaas` 的 layout / provider 相关 Fuma 依赖下沉
- 阶段 1 对应用层尽量保持现有配置字段和使用习惯，避免引入新的理解成本
- 阶段 2 统一处理 MDX 解析能力下沉和能力裁剪
- `fumadocs 16.8.x` 升级不纳入本轮执行

## Phase 1: 一次性完成 `ddaas` 的 Layout / Provider 下沉

### 目标

- 将 `ddaas` 中与布局、Provider、导航配置相关的 `fumadocs-*` 直接依赖一次性下沉到 `third-ui`
- 让上层应用后续只负责配置和个性化控制
- 保持现有菜单字段和配置习惯，优先平滑迁移

### 范围

覆盖以下 layout 相关入口：

- `apps/ddaas/src/app/[locale]/layout.tsx`
- `apps/ddaas/src/app/[locale]/layout.config.tsx`
- `apps/ddaas/src/app/[locale]/(home)/layout.tsx`
- `apps/ddaas/src/app/[locale]/(content)/layout.tsx`
- `apps/ddaas/src/app/[locale]/(clerk)/layout.tsx`
- `apps/ddaas/src/app/[locale]/docs/layout.tsx`
- `apps/ddaas/src/app/[locale]/(content)/blog/layout.tsx`
- `apps/ddaas/src/app/[locale]/(home)/legal/layout.tsx`

### 执行项

1. 在 `third-ui` 中新增根壳层组件，封装 `RootProvider`
2. 在 `third-ui` 中新增统一的 layout 配置类型与 layout 入口
3. 在 `third-ui` 中新增“兼容配置 -> 内部模型 -> Fuma props”的映射层
4. 将 `ddaas` 的根布局改为依赖 `third-ui` 根壳组件
5. 将 `ddaas` 的 Home / Docs / Blog / Legal / Clerk 等布局统一改为依赖 `third-ui` 暴露的布局组件
6. 将 `layout.config.tsx` 改为仅返回应用配置，不再直接返回 Fuma 类型

### 菜单配置策略

阶段 1 不强推新的配置 DSL，而是优先保持现有字段风格和平滑过渡。

对应用层尽量继续兼容以下字段和结构：

- `text`
- `url`
- `description`
- `icon`
- `external`
- `type`
- `items`
- `menu`
- `secondary`
- `mobilePinned`
- `children`

这些字段后续由 `third-ui` 内部统一转换和适配。

这样做的目的不是追求新的语义设计，而是：

- 防止 `fumadocs` 字段和类型变化直接打到应用层
- 保持现有项目和使用者的理解成本最低
- 为后续升级 `16.8.x` 留出缓冲层

### 交付标准

- `ddaas` 不再直接 import `RootProvider`
- `ddaas` 不再直接 import `DocsLayout`
- `ddaas` 不再直接 import `BaseLayoutProps` / `HomeLayoutProps` / `DocsLayoutProps`
- `ddaas` 中 layout 相关代码只负责配置、tree 和业务插槽
- Fuma layout 协议和类型变化被限制在 `third-ui` 内部

## Phase 2: 完成 MDX 能力下沉与配置化裁剪

### 目标

- 将 `ddaas` 中分散的 MDX 解析依赖下沉到 `local-md`
- 将 `third-ui` 中的 MDX 展示能力拆分为可按需组合的组件集
- 让上层应用按 feature / preset 选择能力，而不是自行拼装全量 pipeline

### 执行项

1. 将 `apps/ddaas/src/lib/local-md-source.ts` 中的 math / code / npm / steps / shiki 等能力收敛到 `local-md`
2. 在 `local-md` 中实现 feature / preset 机制
3. 在 `third-ui` 中拆分 MDX 展示组件出口，避免总入口一次性导出全部能力
4. 按 `base / code / math / mermaid / type-table` 等模块拆分组件集
5. 调整 `ddaas` 的 MDX 组件注册逻辑，让应用层只声明启用哪些能力

### 裁剪原则

MDX 裁剪必须同时覆盖两层：

1. 解析能力
2. 渲染能力

仅做运行时布尔开关不够，必须尽量做到：

- feature 独立模块化
- 基础入口不顶层 import 全部能力
- 避免单一 barrel 文件放大全量依赖

### 交付标准

- `ddaas` 不再直接 import `remarkMath` / `rehypeKatex` / shiki transformer 等解析依赖
- `ddaas` 不再直接依赖 `fumadocs-ui/components/*` 这类 MDX 展示组件入口
- `local-md` 负责解析能力和能力编排
- `third-ui` 负责展示组件和布局侧适配
- 应用层可按需选择 MDX 能力，降低不必要依赖进入生产环境的概率

## Post Phase: 再处理 `fumadocs 16.8.x` 升级

这是后置阶段，不与本轮重构混做。

原因：

- 当前若直接升级，会同时冲击 `ddaas`、`third-ui`、`local-md`
- 先完成两阶段边界下沉后，未来升级将主要影响包层

目标：

- 在 `third-ui` / `local-md` 内部适配 `16.8.x`
- 将破坏性变更尽量限制在包层
- 确保 `ddaas` 仅需要少量配置变更或无需变更

## Risks

- 如果只做“代码搬运”，不做边界抽象，未来仍会被 Fuma 绑架
- 如果只做运行时开关，不做 feature 模块拆分，裁剪效果会有限
- 如果将 `RootProvider` 下沉到 `CustomHomeLayout`，会把全局 provider 和页面布局错误耦合
- 如果将 UI 与解析能力全部塞进 `local-md`，包职责会失衡，后续替换 UI 框架成本反而更高

## Final Decision Summary

本次方案的关键决策如下：

1. `RootProvider` 可以下沉，但应下沉到 `third-ui` 的根壳层，而不是 `CustomHomeLayout`
2. `ddaas` 中 layout 相关 Fuma 依赖应逐步下沉到 `third-ui`
3. `ddaas` 中 MDX 解析相关依赖应逐步下沉到 `local-md`
4. `local-md` 负责解析能力与 feature 编排
5. `third-ui` 负责 Provider、Layout、Docs UI 与 MDX 展示组件
6. MDX 裁剪必须同时覆盖解析层和渲染层
7. `fumadocs 16.8.x` 升级是下一阶段，不与本轮边界重构同时处理
