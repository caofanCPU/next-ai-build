# Custom Layout 设计说明

本文说明 `packages/third-ui/src/fuma/base` 这一套自定义布局封装的定位、能力边界、主要配置点，以及与 `fumadocs-ui` 的关系。

当前目标不是替换 Fumadocs 的底层导航交互，而是：

- 由 `third-ui` 统一接管站点级 Header / Banner / Home Layout 配置协议
- 让应用层只负责声明菜单数据、站点标题、Banner 开关和少量个性化配置
- 把 `fumadocs-ui` 的易变实现细节收敛在 `third-ui` 内部

## 核心结构

当前布局能力主要由以下几层组成：

- `site-layout.tsx`
  站点级装配层，提供 `createSiteBaseLayoutConfig`、`SiteHomeLayout`、`SiteDocsLayout`、导航配置协议类型等
- `custom-home-layout.tsx`
  Home 页面布局壳，负责组合 Banner、Header、Footer、GoToTop，并向 `HomeLayout` 注入顶部相关变量
- `custom-header.tsx`
  自定义 Header 渲染层，负责桌面端和移动端菜单、主题切换、语言切换、搜索按钮、自定义 secondary/pinned 项的排布
- `fuma-banner-suit.tsx`
  Banner 适配层，负责真实 Banner 内容或空 Banner 占位层

职责划分上：

- `site-layout` 负责“协议”和“站点配置入口”
- `custom-home-layout` 负责“页面空间模型”
- `custom-header` 负责“导航结构和交互编排”
- `fuma-banner-suit` 负责“顶部 Banner 层”

## 应用层如何使用

应用层通常不应该直接拼装 `HomeLayoutProps` 或手写 `LinkItemType` 细节，而是通过 `site-layout.tsx` 暴露的协议来声明配置。

典型使用流程：

1. 用 `createSiteBaseLayoutConfig` 生成站点基础配置
2. 用 `createSiteNavLink` / `createSiteNavGroup` 或直接写 `SiteNavItemConfig[]` 描述菜单
3. 在业务页面中调用 `SiteHomeLayout`

应用层关心的主要内容：

- 站点首页地址
- 标题与图标
- i18n 配置
- github 地址
- 左侧一级菜单和多列下拉菜单
- 右侧 secondary 功能按钮
- 是否展示 Banner
- Header 高度、Banner 高度、动作区顺序等个性化参数

## 菜单配置协议

### 基础导航项

`SiteNavLinkItemConfig`

用于最常见的单链接菜单项，支持：

- `text`
- `url`
- `external`
- `icon`
- `description`
- `on`
- `secondary`
- `mobilePinned`

其中：

- `secondary: true`
  表示该项进入 Header 右侧功能区
- `mobilePinned: true`
  表示该项在移动端仍然固定显示在顶栏，而不是收进下拉菜单
- `on: 'nav' | 'menu' | 'all'`
  控制该项在哪个区域渲染

### 分组下拉菜单

`SiteNavMenuItemConfig`

用于 Docs、Preview 这类多列 Mega Menu。

核心字段：

- `type: 'menu'`
- `text`
- `url`
- `items`
- `menu`

子项仍然是 `SiteNavItemConfig[]`，因此支持：

- 普通链接卡片
- 自定义 React 节点
- 带 `banner` 的 landing 卡片

### 完全自定义项

`SiteNavCustomItemConfig`

通过 `type: 'custom'` + `children` 直接注入 React 节点，适合：

- 登录态组件
- 积分/信用额度组件
- 用户菜单
- 通知按钮

## Header 行为要点

`custom-header.tsx` 在当前设计下提供了几类可控行为。

### 1. 左右区域分流

Header 顶部按语义分成三部分：

- 左侧主导航
- 桌面端右侧功能区
- 移动端顶栏与移动端下拉菜单

左侧主导航默认承载：

- 顶层普通菜单项
- 顶层分组菜单项

右侧功能区默认承载：

- 搜索
- 主题切换
- 语言切换
- `secondary` 项
- 可选独立排序的 GitHub 项

### 2. secondary 与 mobilePinned

这是当前菜单协议里最重要的两个布局字段。

- `secondary`
  把菜单项从主导航移到桌面功能区
- `mobilePinned`
  让该项在移动端仍然出现在顶栏上，而不是被收进菜单

### 3. Action Order

`CustomHomeLayout` 支持 `actionOrders`，分别控制：

- `desktop`
- `mobileBar`
- `mobileMenu`

对应可选项：

- Desktop
  `search | theme | i18n | secondary | github`
- MobileBar
  `pinned | search | menu`
- MobileMenu
  `secondary | github | separator | i18n | theme`

这意味着应用层可以只改排列顺序，而不需要改 Header 实现。

## CustomHomeLayout 主要参数

`CustomHomeLayoutProps`

### 站点与布局基础

- `locale`
  当前语言
- `options`
  传给 `HomeLayout` 的基础配置，通常由 `site-layout.tsx` 组装

### 顶部空间相关

- `showBanner`
  是否显示 Banner 内容
- `bannerHeight`
  Banner 高度，单位 rem
- `headerHeight`
  Header 高度，单位 rem
- `headerPaddingTop`
  页面内容相对顶部额外补偿的空间
- `floatingNav`
  Header 是否采用浮动模式

### 外观与插槽

- `navbarClassName`
  Header 外层自定义 class
- `banner`
  自定义 Banner 节点
- `footer`
  自定义 Footer
- `goToTop`
  自定义回顶组件

### 功能开关

- `showFooter`
- `showGoToTop`

### 行为配置

- `actionOrders`
- `localePrefixAsNeeded`
- `defaultLocale`

## Fumadocs CSS 变量的限制与开放点

这是当前自定义布局设计里最关键的一部分。

### 必须明确的事实

`fumadocs-ui` 并不是只靠 React props 控制顶部空间，它内部大量依赖 CSS 变量来计算：

- docs header 的 sticky 起点
- toc 的 top 和 height
- sidebar 的 top 和 height
- toc popover 的占位

Fuma 16.8.x 内部实际使用的顶部变量核心是：

- `--fd-banner-height`
- `--fd-header-height`
- `--fd-toc-popover-height`

并在 docs/notebook 布局内部推导出：

- `--fd-docs-row-1`
- `--fd-docs-row-2`
- `--fd-docs-row-3`

因此：

- 只改我们自己的 React 组件高度，不一定能让 Fuma 的 sticky 区域同步
- 如果不显式接住这些变量，页面会出现“顶部空白”“内容透出”“TOC 偏移不对齐”等问题

### 当前开放给业务层的变量能力

当前 `third-ui` 主要开放的是：

- `bannerHeight`
- `headerHeight`
- `headerPaddingTop`
- `navbarClassName`

其中最重要的是：

- `bannerHeight`
  影响 `--fd-banner-height`
- `headerHeight`
  影响 `--fd-header-height`

也就是说，业务层现在改这两个参数时，已经不再只是改视觉高度，而是在参与 Fuma 顶部空间模型。

### 当前限制

虽然 `third-ui` 已经接管了 Home Header 和 Banner 组合，但 docs 布局仍然部分依赖 Fuma 默认容器与 sticky 逻辑，因此仍有这些限制：

1. 顶部空间不是纯业务层完全自由布局

Fuma 的 docs 容器仍然会基于自身 row 变量做 sticky 计算，因此应用层不能完全无视这些变量。

2. 无 Banner 时的顶部空白问题，本质是 Fuma 顶部空间模型的一部分

当前方案里，无 Banner 不是“彻底没有 Banner 容器”，而是保留与顶部背景一致的 Banner 占位层。这不是临时 hack，而是为了让滚动内容不会从 Header 上方透出来。

3. Header 的视觉盒子会影响 Banner 区域感知

当前 Header 仍然保留圆角、边框、阴影和 blur 卡片感，因此视觉上会对 Banner 空间形成轻微“挤占”感。这一现象当前可以接受，但需要在后续文档和重构中明确记录。

### 什么时候应该继续开放

如果后续要进一步降低 `fuma.css` 的覆盖比例，建议优先开放以下能力：

- docs header height 的统一配置入口
- toc popover height 的统一配置入口
- docs/container/header slot 的进一步接管

## 当前样式补丁的定位

`packages/third-ui/src/styles/fuma.css` 当前仍然存在，但应该理解为：

- 它是 Fuma 内部 sticky / toc / subnav 的兼容层
- 它不是 Header/Banner 的主控制面

后续方向应当是：

- Header / Banner / Home 主布局继续由 `custom-home-layout.tsx` 和 `custom-header.tsx` 主导
- `fuma.css` 逐步缩减为对 Fuma 内部未开放节点的少量 override

## 旧项目迁移建议

旧项目如果要切到这套 custom layout，建议按以下方式迁移。

### 1. 先迁菜单数据，不先迁 Fuma 组件细节

优先把业务层原来直接依赖 `fumadocs-ui` 的菜单项，改成 `SiteNavItemConfig[]` 或 `createSiteNavGroup` 这套协议。

### 2. 站点基础配置统一走 `createSiteBaseLayoutConfig`

应用层只关心：

- homeUrl
- title
- i18n
- githubUrl
- transparentMode

### 3. 顶部空间通过参数声明，不在应用层手写 CSS 变量

优先通过：

- `showBanner`
- `bannerHeight`
- `headerHeight`
- `headerPaddingTop`

来调整，而不是在应用层直接写 `--fd-banner-height` 或 `--fd-header-height`。

### 4. 如果站点不需要真实 Banner，也建议保留空 Banner 占位思路

原因是：

- Fuma 顶部空间模型会持续参与 docs/header/toc 的 sticky 计算
- 空 Banner 占位能避免正文从 Header 顶部透出

### 5. 业务侧只负责配置，不负责理解 Fuma 内部 row 变量

这是 `third-ui` 这一层存在的核心价值。应用层应该感知的是：

- Header 高度
- Banner 高度
- 菜单项类型
- 动作区顺序

而不是：

- `--fd-docs-row-1`
- `--fd-docs-row-2`
- `--fd-docs-row-3`

这些 Fuma 内部空间实现细节。
