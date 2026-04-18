# Header 菜单配置速查

> 只关心 `apps/ddaas/src/app/[locale]/layout.config.tsx` 里的 `levelNavLinks` / `homeNavLinks` 配置即可。

## 主菜单左侧（常规导航）
- 默认行为：数组里的每个 `LinkItemType` 都会出现在桌面左侧的横向菜单，并在移动端折叠到下拉列表顶部。  
- `text` + `url` 是最简单的单层链接；`type: 'menu'` + `items` 可构建 Docs 这种多列 Mega Menu。  
- 需要完全自定义时设置 `type: 'custom'`，然后传入任意 React 组件。

## 主菜单右侧（功能按钮区）
- 给项加 `secondary: true` 就会移到桌面 Header 右侧，与主题/语言/搜索在同一行。  
- 常见场景：登录、积分、通知等操作按钮。

## 移动端个性化
- 默认所有 `secondary: true` 项会被收进下拉菜单底部。  
- 若希望某些重要按钮在移动端仍保持可见，额外加 `mobilePinned: true`。这会把该项渲染在移动端主菜单栏的右侧（紧挨着搜索/菜单按钮）。  
- 其他未加 `mobilePinned` 的 secondary 项仍会只出现在下拉菜单里。

## 层级下拉（Docs 等 Mega Menu）
- 顶层入口写成 `{ type: 'menu', text, url, items: [...] }`，在桌面上会展开多列卡片；移动端会在抽屉里渲染一个分组。  
- `items` 里的每个对象就是一张卡片：`text`/`description`/`url` 决定内容，`icon` 可选，`menu.banner` 用于定制顶部 banner，`menu.className` 控制在网格中的行/列跨度。  
- 想分端展示不同内容时，`on` 字段仍然适用。给顶层或某个子卡片加 `on: 'nav'` / `'menu'` / `'all'`，即可指定它只在桌面下拉、只在移动抽屉里，或两端都显示。  
- 需要完全自定义布局时，子项一样可以用 `type: 'custom'`，直接返回 React 组件。

```txt
Docs 菜单结构（apps/ddaas/src/app/[locale]/layout.config.tsx:47-112）
  - 顶层项
      - type: 'menu': 告诉 Header 这是会展开内容的入口。
      - text: t1('docs'): 入口文字，通过 linkPreview.docs 语言包翻译。
      - url: /{locale}/docs: 用户点击标题本身会直接到文档首页。
      - 没写 type，默认就是普通链接卡片。
      - text/description/url: 卡片标题、副文案、点击跳转地址。
      - menu.banner: 自定义顶部 Banner。这里是一个 Image，使用 maskImage 做渐隐过渡；因为它挺高，还设置了 menu.className: 'md:row-span-2'，让它在网格中占两行。
  - 其余子项（如 FumaMDX、Quick generation 等）
      - 加了 icon: <ShieldUserIcon /> 之类的图标，这些图标会显示在卡片左侧。
      - menu.className 控制它们在网格中的列/行起始位置，让 2×3 布局排列整齐。
      - 其它字段与 FumaDocs 一样，都是描述和跳转链接。

  理解技巧

  - 只要记住：顶层 type:'menu' + items 就是一个 Mega Menu；每个 items 元素的 menu 属性是“卡片的表现层配置”（banner、在网格中的定位等），而 text/description/url 才是业务内容。这样看每个对象就清晰多了。


on 字段可以写在任何 LinkItemType 上（顶层或子项都可以），用来指定“在哪个区域渲染”：

  - on: 'nav' → 只出现在桌面主导航（也就是那条横向菜单）
  - on: 'menu' → 只出现在移动端的下拉菜单
  对你提到的那组层级菜单：

  - 顶层 type:'menu' 项：如果给它配 on: 'nav'，桌面上仍有 Docs 下拉，移动端的抽屉里就不会出现“Docs”这一组；反之 on: 'menu' 会把它只放在移动端下拉列表，桌面上就不显示这个入口。
  - 子项：同理，某个 items 里的卡片可以单独设置 on，例如给 Quick generation 配 on: 'menu'，那它只会出现在移动下拉的“Docs”分组里，桌面打开 Docs 时看不到该卡片。反向也一样。

  常见做法是：

  1. 顶层 Docs 入口保留默认（两端都显示），确保用户在任何设备都能进 Docs；
  2. 子项里如果有某些内容只想在移动端展示，就给那几项加 on: 'menu'，桌面就不会渲染它们；如果只想桌面显示则用 on: 'nav'。

  记得 mobilePinned / secondary 等属性只影响“主菜单栏 vs. 功能区”的布局，不会改变 on 对应的区域筛选，两者可以配合使用。
```

## 行为顺序自定义
- `<CustomHomeLayout>` 支持 `actionOrders` 属性，可分别控制三个区域：
  - `desktop`: `('search' | 'theme' | 'i18n' | 'secondary' | 'github')[]`，桌面右侧工具条。`github` 仅在配置了 `githubUrl` 时生效，并可让 GitHub 图标脱离 secondary 队列单独排序。
  - `mobileBar`: `('pinned' | 'search' | 'menu')[]`，移动端顶部工具条。
  - `mobileMenu`: `('secondary' | 'github' | 'separator' | 'i18n' | 'theme')[]`，移动抽屉中的功能顺序。
- 示例
  ```tsx
  <CustomHomeLayout
    actionOrders={{
      desktop: ['search', 'theme', 'github', 'i18n', 'secondary'],
      mobileBar: ['search', 'pinned', 'menu'],
      mobileMenu: ['theme', 'i18n', 'separator', 'secondary', 'github'],
    }}
    {...otherProps}
  />
  ```
- 不把 `github` 写进数组时它会继续随 secondary 一起渲染，保持原有表现。
- 不配置则沿用默认顺序（与当前 UI 一致）。
- 推荐
  - 桌面端： 网站LOGO-标题-一级菜单项 | 空白分割 | 搜索框-主题切换-Github图标-语言切换-自定义菜单按钮
  - 移动端：
    - 网站LOGO-标题 | 空白分割 | 搜索框-自定义菜单按钮Pinned-菜单下拉按钮
    - 一级子菜单及子菜单项
    - 主题切换-语言切换 | 空白分割 | 自定义菜单按钮非Pinned-Github图标 

## 其它提示
- `on: 'nav' | 'menu' | 'all'` 可强制指定某个链接只在桌面导航或移动菜单中展示，不写则等同 `'all'`。  
- `type: 'icon'`、`type: 'button'` 会自动继承 Fumadocs 提供的样式，也会默认算 secondary。需要它们回到左侧时手动设置 `secondary: false`。  
- 任何需要访问翻译文本的地方，请继续使用 `getTranslations` 保证多语言正常工作。
