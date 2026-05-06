# Custom Layout Skills

本文是 `custom-home-layout` / `custom-header` / `site-layout` 的使用速记，偏向能力清单与参数对照。

## 适用范围

这套能力主要用于：

- 站点首页或营销页使用 `SiteHomeLayout`
- 统一 Header / Banner / Footer / GoToTop 的站点级装配
- 应用层只声明导航数据和少量布局参数

不适用于：

- 需要完全摆脱 `fumadocs-ui` sticky / docs row 模型的页面
- 需要直接接管 docs container / docs header 全部实现的场景

## 关键导出

来自 `@third-ui/fuma/base` 的常用导出：

- `SiteHomeLayout`
- `SiteDocsLayout`
- `DocsRootProvider`
- `HomeTitle`
- `createSiteBaseLayoutConfig`
- `createSiteNavLink`
- `createSiteNavGroup`

协议类型：

- `SiteBaseLayoutConfig`
- `SiteHomeLayoutConfig`
- `SiteDocsLayoutConfig`
- `SiteNavItemConfig`
- `SiteNavLinkItemConfig`
- `SiteNavMenuItemConfig`
- `SiteNavCustomItemConfig`
- `SiteMenuLeafConfig`
- `SiteMenuGroupConfig`
- `HeaderActionOrders`

## 能力清单

### Header 相关

- 桌面端主导航
- 桌面端右侧功能区
- 移动端顶栏
- 移动端菜单下拉
- 主题切换插槽
- i18n 插槽
- 搜索插槽
- secondary 项与 mobilePinned 项编排
- GitHub 项单独排序

### Banner 相关

- 真实 Banner 内容展示
- 无 Banner 内容时的空 Banner 占位层
- Banner 高度统一参与顶部空间模型

### 页面壳层

- Footer 注入
- GoToTop 注入
- Header 浮动模式
- Header 动作顺序控制
- 站点标题与图标组合

## SiteHomeLayoutConfig 常用字段

### 顶部空间

- `showBanner`
  是否显示 Banner 内容
- `bannerHeight`
  Banner 高度，单位 rem
- `headerHeight`
  Header 高度，单位 rem
- `headerPaddingTop`
  页面内容额外顶部补偿，单位 rem
- `floatingNav`
  Header 是否采用浮动模式

### 外观插槽

- `navbarClassName`
  Header 外层 class
- `banner`
  自定义 Banner 节点
- `footer`
  自定义 Footer 节点
- `goToTop`
  自定义回顶节点

### 功能开关

- `showFooter`
- `showGoToTop`

### 行为定制

- `actionOrders`
- `localePrefixAsNeeded`
- `defaultLocale`

## actionOrders 速查

### desktop

可选值：

- `search`
- `theme`
- `i18n`
- `secondary`
- `github`

### mobileBar

可选值：

- `pinned`
- `search`
- `menu`

### mobileMenu

可选值：

- `secondary`
- `github`
- `separator`
- `i18n`
- `theme`

## 菜单项速查

### 普通菜单项

最小字段：

- `text`
- `url`

常见扩展：

- `description`
- `icon`
- `on`
- `secondary`
- `mobilePinned`

### 分组菜单项

最小字段：

- `type: 'menu'`
- `text`
- `items`

常见扩展：

- `url`
- `icon`
- `menu`

### 自定义菜单项

最小字段：

- `type: 'custom'`
- `children`

## Fuma CSS 变量速查

当前与顶部空间强相关的变量：

- `--fd-banner-height`
- `--fd-header-height`
- `--fd-toc-popover-height`

与 docs sticky 计算相关的内部变量：

- `--fd-docs-row-1`
- `--fd-docs-row-2`
- `--fd-docs-row-3`

当前业务层推荐只感知：

- `bannerHeight`
- `headerHeight`

不推荐业务层直接写：

- `--fd-docs-row-*`
- `--fd-toc-popover-height`

## 当前已知限制

### 1. Header 与 Banner 的视觉重叠感

无 Banner 内容时，即使保留了空 Banner 占位层，Header 由于卡片感样式存在，视觉上仍可能轻微“吃进” Banner 区域。

这是视觉表现问题，不是 Banner 高度计算失效。

### 2. Docs 布局仍然部分依赖 Fuma 默认 sticky 模型

Home Header 已由 `third-ui` 接管，但 docs 容器和 toc/sidebar 的 sticky 计算仍然使用 Fuma 内部 row 变量。

### 3. `fuma.css` 仍然是必要兼容层

当前不能完全删除。它仍负责：

- TOC top 对齐
- 移动端 tocnav / subnav 修正
- 某些 Fuma 内部结构 override

## 推荐实践

### 推荐

- 应用层只写菜单数据和布局参数
- 高度只通过 `bannerHeight` / `headerHeight` 调整
- 站点基础配置统一通过 `createSiteBaseLayoutConfig`
- 复杂 Mega Menu 用 `createSiteNavGroup`

### 不推荐

- 在应用层直接 hardcode Fuma 顶部 CSS 变量
- 直接依赖 `fumadocs-ui` 的菜单组件和导出路径
- 用全局 CSS 覆盖来代替 `SiteHomeLayout` 参数配置

## 后续可扩展点

如果后续继续深化这套能力，优先考虑：

- 抽象 docs header height 配置入口
- 抽象 docs toc popover height 配置入口
- 进一步接管 docs layout slots
- 持续压缩 `fuma.css` 中的补丁项
