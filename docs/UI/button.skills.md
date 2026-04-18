# Button Skills

本说明给 AI 使用。目标是快速判断该用哪个按钮、参数怎么传、哪些样式可以通过 `className` 定制、哪些属于组件内强约束。

## 按钮体系定义

这里的“按钮"不是只指传统 `button` 标签, 而是指一组同源的可点击交互控件。

设计原则: 

- 网站按钮在架构上同源。
- 基础交互、尺寸、圆角、间距、状态处理尽量统一。
- 不同业务语义主要通过自定义样式区分, 而不是无限新增新组件。
- 能用同一个基座按钮派生的类型, 优先视为同一按钮体系, 而不是独立组件种类。

对 AI 的要求: 

- 优先从现有按钮基座中选变体, 不要轻易新造按钮组件。
- 语义差异优先通过 `className`、`variant`、宽度、边框、hover、颜色来表达。
- 只有在交互结构明显不同的情况下, 才切换到另一类按钮基座。

## 按钮类型覆盖表

| 按钮类型 | 是否纳入体系 | 当前推荐基座/组件 | 说明 |
| --- | --- | --- | --- |
| 普通点击按钮 | ✅ | `XButton single` / `GradientButton(onClick)` | 最常用操作按钮 |
| 链接按钮 | ✅ | `GradientButton(href)` | 外观是按钮, 行为是跳转 |
| 图标按钮 | ✅ | `XButton single` | 传图标, `text: ''` |
| 文字按钮 | ✅ | `XButton single` / `GradientButton` | 带胶囊边框但颜色不起眼的按钮, 使用 `variant="subtle"` 配合自定义边框颜色 |
| 下拉按钮 | ✅ | `XButton split` | 左主操作 + 右更多操作 |
| 分组按钮 | ✅ | `XPillSelect` / `XFilterPills` / `XFormPills` | 筛选、单选、多选 |
| Toggle 按切按钮 | ✅ | `XToggleButton` | 单选切换按钮组, 支持 `floating badge`, 适合 billing / tabs-like toggle / 视图切换 |

## 通用规则

- 两个组件都使用 `cn(...)` 合并类名, 内部基于 `twMerge(clsx(...))`。
- 结论: 使用方传入的 `className` 如果和默认 Tailwind 类冲突, 通常以后传入的为准。
- 适合外部覆盖的常见样式: 
  - 背景色: `bg-*` `from-*` `to-*`
  - 边框: `border-*` `border-2`
  - 宽度: `w-*` `min-w-*` `max-w-*`
  - hover: `hover:bg-*` `hover:border-*` `hover:text-*`
- 不要假设“所有样式都可改"。结构型样式、外层容器样式、`disabled/loading` 行为, 很多是组件内部固定的。

## 组件选择

- 只需要单个按钮, 优先用 `XButton` 的 `type="single"`。
- 需要渐变、链接跳转、图文按钮, 用 `GradientButton`。
- 需要单选切换按钮组, 用 `XToggleButton`。
- 需要主操作 + 下拉菜单, 用 `XButton` 的 `type="split"`。
- 如果需求是深度定制 split 菜单项样式, 当前 `XButton split` 不够开放, 可能要改源码。
- 要做图标按钮, 优先用 `XButton single`, 传图标, `text: ''`。
- 要做文字按钮, 优先用 `XButton single`, 传 `icon: null | false`, 配合 `variant="subtle"` 和自定义 `className` 来设置边框颜色。

## GradientButton

文件: `packages/third-ui/src/fuma/mdx/gradient-button.tsx`

### 适用场景

- 可作为按钮, 也可作为链接。
- 支持默认图标、loading、左右图标位置、对齐方式。
- 适合做强调型 CTA。

### 参数

- `title`
  - 含义: 按钮文案。
  - 必填。
- `icon`
  - 含义: 自定义图标。
  - 默认: 不传时自动使用箭头图标；loading 时自动切为转圈图标。
- `iconForcePosition`
  - 含义: 强制图标在左或右。
  - 可选值: `'left' | 'right'`
  - 默认: 有 `onClick` 时偏左, 无 `onClick` 时偏右。
- `align`
  - 含义: 按钮内容对齐, 同时影响外层容器对齐。
  - 可选值: `'left' | 'center' | 'right'`
  - 默认: `'left'`
- `disabled`
  - 含义: 禁用按钮。
  - 默认: `false`
- `className`
  - 含义: 按钮本体的自定义样式。
  - 默认: 空字符串。
- `iconClassName`
  - 含义: 图标样式。
  - 默认: `h-4 w-4`
- `href`
  - 含义: 链接地址。
  - 默认: 未传时为 `"#"`
- `openInNewTab`
  - 含义: 链接是否新开标签页。
  - 默认: `true`
- `preserveReferrer`
  - 含义: 新开标签页时是否保留 referrer。
  - 默认: `false`
- `onClick`
  - 含义: 点击事件。传了以后优先走按钮点击逻辑。
  - 默认: 不传
- `loadingText`
  - 含义: loading 时显示的文案。
  - 默认: `title` 的文本值, 否则 `Loading...`
- `preventDoubleClick`
  - 含义: 点击后是否进入 loading 并阻止重复点击。
  - 默认: `true`
- `variant`
  - 含义: 视觉风格。
  - 可选值: `'default' | 'soft' | 'subtle'`
  - 默认: `'default'`

### 默认样式

- 基础尺寸: `h-11 px-8`
- 基础排版: `text-base font-bold`
- 形状: `rounded-full`
- 有 focus ring
- `default`: 渐变背景 + 渐变 hover + 白字
- `soft`: 主题背景 + 主题边框 + 轻微阴影
- `subtle`: 浅背景 + 中性边框

### 可自定义项

- 可以通过 `className` 改: 
  - 背景色
  - 渐变色
  - 边框颜色和粗细
  - `min-w-*` / `max-w-*` / `w-*`
  - 高度和内边距
  - hover 色
  - 圆角
  - 字号和字重
- 可以通过 `iconClassName` 改图标大小和颜色。

### 强约束

- 外层还有一个包装 `div`, 它的 `gap-3` 和对齐不是 `className` 控制的。
- `disabled` / `loading` 行为是固定的, 不只是视觉变化。
- loading 图标固定为 `Loader2`, 默认图标固定为箭头。

### 示例

```tsx
<GradientButton
  title="Buy Now"
  href="/pricing"
  className="min-w-[160px] max-w-[240px] bg-black text-white hover:bg-neutral-800 border border-black"
/>
```

```tsx
<GradientButton
  title="Create Post"
  onClick={handleCreate}
  variant="soft"
  className="bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white rounded-xl px-6"
  iconClassName="w-4 h-4 text-white"
/>
```

## XButton

文件: `packages/third-ui/src/main/x-button.tsx`

支持两种模式: `single` 和 `split`。

## XButton Single

### 适用场景

- 纯点击按钮。
- 需要简单但稳定的样式扩展。
- 比 `GradientButton` 更适合作为业务操作按钮。

### 参数

- `type`
  - 固定: `'single'`
- `button`
  - 含义: 主按钮配置。
  - 结构: 
    - `icon`: 图标, 必填
    - `text`: 文案, 必填
    - `onClick`: 点击事件, 必填
    - `disabled?`: 是否禁用, 默认 `false`
- `loadingText`
  - 含义: loading 文案。
  - 默认: `button.text`, 否则 `Loading...`
- `minWidth`
  - 含义: 最小宽度 class。
  - 默认: `min-w-[110px]`
- `className`
  - 含义: 按钮本体自定义样式。
  - 默认: 空字符串。
- `iconClassName`
  - 含义: 图标样式。
  - 默认: `w-5 h-5`
- `variant`
  - 含义: 视觉风格。
  - 可选值: `'default' | 'soft' | 'subtle'`
  - 默认: `'default'`

### 默认样式

- 移动端默认 `w-full`, 桌面端 `sm:w-auto`
- 默认最小宽度: `min-w-[110px]`
- 基础排版: `text-sm font-semibold`
- 形状: `rounded-full`

### 可自定义项

- `className` 可覆盖: 
  - 背景色
  - 边框
  - hover 色
  - 宽度 / 最大宽度
  - 圆角
  - 内边距
- `minWidth` 适合明确指定最小宽度。

### 强约束

- 点击后进入 loading, 期间不可重复点击。
- `disabled/loading` 会叠加禁用态样式。
- 默认是移动端占满宽度, 如果不需要要主动覆盖。

### 示例

```tsx
<XButton
  type="single"
  button={{ icon: <Plus />, text: "New", onClick: handleNew }}
  minWidth="min-w-[140px]"
  className="w-auto max-w-[220px] bg-blue-600 text-white hover:bg-blue-700 border border-blue-700"
/>
```

```tsx
<XButton
  type="single"
  variant="subtle"
  button={{ icon: <Download />, text: "Export", onClick: handleExport }}
  className="border-neutral-400 hover:bg-neutral-100 rounded-md"
/>
```

## XButton Split

### 适用场景

- 左边主操作, 右边展开更多操作。
- 适合轻度换肤, 不适合深度改结构。

### 参数

- `type`
  - 固定: `'split'`
- `mainButton`
  - 含义: 左侧主按钮配置。
  - 结构: 
    - `icon`: 图标, 必填
    - `text`: 文案, 必填
    - `onClick`: 点击事件, 必填
    - `disabled?`: 是否禁用, 默认 `false`
- `menuItems`
  - 含义: 下拉菜单项数组。
  - 每项结构: 
    - `icon`: 图标, 必填
    - `text`: 文案, 必填
    - `onClick`: 点击事件, 必填
    - `disabled?`: 是否禁用, 默认 `false`
    - `tag?`: 右上角标记, 结构为 `{ text, color? }`
    - `splitTopBorder?`: 是否显示顶部强调分割线
- `loadingText`
  - 含义: loading 文案。
  - 默认: `mainButton.text`, 否则 `Loading...`
- `menuWidth`
  - 含义: 菜单宽度 class。
  - 默认: `w-full sm:w-40`
- `className`
  - 含义: 外层容器样式。
  - 默认: 空字符串。
- `mainButtonClassName`
  - 含义: 左侧主按钮样式。
  - 默认: 空字符串。
- `dropdownButtonClassName`
  - 含义: 右侧下拉按钮样式。
  - 默认: 空字符串。
- `iconClassName`
  - 含义: 按钮图标样式。
  - 默认: `w-5 h-5`
- `variant`
  - 含义: 视觉风格。
  - 可选值: `'default' | 'soft' | 'subtle'`
  - 默认: `'default'`

### 默认样式

- 外层容器: `rounded-full`
- 左按钮: `flex-1 min-w-0 rounded-l-full`
- 右按钮: 固定窄宽度, 默认 `w-9 sm:w-10`
- 菜单面板: 白底/暗色底, 带边框和阴影

### 可自定义项

- `className`: 改整个 split 容器背景、边框、宽度
- `mainButtonClassName`: 改单击主按钮背景、边框、hover
- `dropdownButtonClassName`: 改右侧下拉按钮背景、边框、hover
- `menuWidth`: 改下拉面板宽度

### 强约束

- 结构固定为“左主按钮 + 右下拉按钮"。
- 左右圆角分工固定；如果要改圆角, 通常三处都要一起改。
- 右侧下拉按钮是窄按钮, 天然不适合做普通按钮宽度。
- 菜单项本身没有暴露 `className`。
- `menuItems[].splitTopBorder` 使用内联样式画线, 外部 class 不能直接覆盖这条线的颜色。
- 菜单项 hover 样式当前基本写死, 不能通过 props 精细控制。

### 示例

```tsx
<XButton
  type="split"
  mainButton={{ icon: <Sparkles />, text: "Publish", onClick: handlePublish }}
  menuItems={[
    { icon: <Clock3 />, text: "Schedule", onClick: handleSchedule },
    { icon: <Archive />, text: "Archive", onClick: handleArchive, splitTopBorder: true },
  ]}
  className="bg-white border border-neutral-300"
  mainButtonClassName="hover:bg-neutral-50"
  dropdownButtonClassName="border-l border-neutral-300 hover:bg-neutral-50"
  menuWidth="w-48"
/>
```

## XToggleButton

文件: `packages/third-ui/src/main/x-toggle-button.tsx`

### 适用场景

- billing 周期切换
- tabs-like 视图切换
- 单选 toggle 按钮组

### 参数

- `options`
  - 含义: 切换项数组
  - 结构: 
    - `value`: string, 唯一标识（必填）
    - `label`: ReactNode, 项显示文案（必填）
    - `disabled?`: boolean, 单项禁用
    - `className?`: string, 单项额外样式
    - `badge?`: ReactNode, floating badge 内容（可选, 激活时显示）
    - `mobileIcon?`: ReactNode, 移动端显示的图标（可选, sm 以下显示）
  - 必填
- `value`
  - 含义: 当前选中值
  - 有值时为受控模式
- `defaultValue`
  - 含义: 默认选中值
  - 无 `value` 时生效
- `onChange`
  - 含义: 切换回调
  - 默认: 无
- `disabled`
  - 含义: 整体禁用
  - 默认: `false`
- `className`
  - 含义: 外层容器样式
- `itemClassName`
  - 含义: 所有按钮项的公共样式
- `activeItemClassName`
  - 含义: 激活项附加样式
- `inactiveItemClassName`
  - 含义: 未激活项附加样式
- `badgeClassName`
  - 含义: `floating badge` 样式
- `minItemWidthClassName`
  - 含义: 每项最小宽度
  - 默认: `min-w-[80px] sm:min-w-[100px] md:min-w-[120px]`
- `maxItemWidthClassName`
  - 含义: 每项最大宽度（配合 truncate 实现文本截断）
  - 默认: `max-w-[120px] sm:max-w-[160px]`
- `itemTextClassName`
  - 含义: 按钮项内文字的大小和排版
  - 默认: `text-xs sm:text-sm md:text-base`
- `itemPaddingClassName`
  - 含义: 按钮项内左右上下边距
  - 默认: `px-2 py-1.5 sm:px-3 sm:py-2`
- `size`
  - 含义: 尺寸
  - 可选值: `'default' | 'compact'`
  - 默认: `'default'`
- `fullWidth`
  - 含义: 是否整组铺满宽度, 且每项等分
  - 默认: `false`
- `name`
  - 含义: 辅助标识
- `ariaLabel`
  - 含义: 无可见标题时建议传, 提升可访问性

### 默认行为

- 支持受控和非受控两种模式
- 未传 `value` 时, 内部自动管理选中状态
- 未传 `defaultValue` 时, 默认选中第一项
- 点击当前已选项不会重复触发切换
- 单项可禁用, 整组也可禁用
- mobileIcon 自动变白色: 激活时, mobileIcon 会自动添加 `text-white` class, 配合 global-icon 的 className 覆盖机制, 自动将主题色图标转为白色

### 默认样式

- 外层容器: 白底/暗色底、浅边框、阴影、`rounded-full`
- 激活项: 主题渐变背景 + 白字
- 未激活项: 中性文字色
- 支持附着在按钮项上方、半内半外的 `floating badge`
- `floating badge` 的样式参考当前 billing 切换实现, 移动端可用

### 可自定义项

- `className`
  - 改整体背景、边框、宽度、阴影
- `itemClassName`
  - 改所有按钮项的公共圆角、内边距、字重
- `itemTextClassName`
  - 改按钮项文字大小和排版, 移动端响应式尺寸适配
- `itemPaddingClassName`
  - 改按钮项内部左右上下边距, 支持响应式调整
- `minItemWidthClassName`
  - 改每个切换项最小宽度基线, 支持响应式
- `maxItemWidthClassName`
  - 改每个切换项最大宽度, 防止文本无限扩张, 配合 truncate 实现截断
- `activeItemClassName`
  - 改选中项颜色、边框、阴影
- `inactiveItemClassName`
  - 改未选中项颜色、hover
- `badgeClassName`
  - 改 floating badge 的颜色、位置、尺寸

### 强约束

- 当前是单选 toggle, 不是多选 toggle
- 当前只负责切换按钮组, 不负责下方内容面板
- 内容展示应由业务层根据 `value` 决定
- mobileIcon 白色化仅对 global-icon 有效；使用其他 icon 库时激活样式不变

### 移动端优化建议

- 使用 mobileIcon 时, 建议减小 itemPaddingClassName 和 itemTextClassName（因为只显示图标）
- 对于有 mobileIcon 的 toggle, minItemWidthClassName 可以设置更小的移动端值（如 `min-w-[40px] sm:min-w-[100px]`）
- mobileIcon 自动处理激活时变白, 使用方无需重复传两个 icon

### 示例

```tsx
<XToggleButton
  value={billingType}
  onChange={setBillingType}
  options={[
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly', badge: 'Save 20%' },
  ]}
/>
```

```tsx
<XToggleButton
  defaultValue="status"
  size="compact"
  fullWidth
  options={[
    { value: 'status', label: 'Status' },
    { value: 'details', label: 'Details' },
    { value: 'stats', label: 'Stats', disabled: true },
  ]}
  className="max-w-[360px]"
/>
```

```tsx
// 移动端响应式: 移动端显示图标, web 端显示文本
<XToggleButton
  value={viewMode}
  onChange={setViewMode}
  itemPaddingClassName="px-1 py-1 sm:px-3 sm:py-2"
  minItemWidthClassName="min-w-[40px] sm:min-w-[100px]"
  maxItemWidthClassName="max-w-[50px] sm:max-w-[160px]"
  options={[
    { value: 'grid', label: 'Grid', mobileIcon: <GridIcon className="h-4 w-4" /> },
    { value: 'list', label: 'List', mobileIcon: <ListIcon className="h-4 w-4" /> },
    { value: 'detail', label: 'Detail', mobileIcon: <MenuIcon className="h-4 w-4" /> },
  ]}
/>
```

## AI 使用建议

- 要改背景、边框、宽度、hover, 优先先传 `className`, 不要急着改源码。
- 要改 split 模式下菜单项 hover、分隔线、每项 className, 目前要改源码。
- 要求“最大最小宽度可控"时: 
  - `GradientButton`: 直接在 `className` 里写
  - `XButton single`: 优先用 `minWidth`, 再配合 `className`
  - `XButton split`: 分别考虑容器、主按钮、下拉按钮, 不要只改一处
- 要求“只是个业务按钮, 不需要链接和渐变"时, 优先 `XButton single`。

## Pill / Tag 类按钮

文件: `packages/third-ui/src/main/pill-select/index.ts`

这一组虽然不是传统 CTA 按钮, 但在业务使用上可以归到“按钮式选择 / 输入控件": 

- `XPillSelect`
  - 通用胶囊选择器
  - 支持单选、 多选、带输入扩展
- `XFilterPills`
  - 过滤器型单选胶囊
- `XFormPills`
  - 表单字段型单选胶囊
- `XTokenInput`
  - 输入式 token/tag
  - 可视为“输入式按钮"

## 组件选择

- 需要单选胶囊, 用 `XPillSelect mode="single"`。
- 需要多选胶囊, 用 `XPillSelect mode="multiple"`。
- 需要给用户边选边补充新值, 用 `XPillSelect + inputEnabled`。
- 需要筛选器 UI, 用 `XFilterPills`。
- 需要表单字段 UI, 用 `XFormPills`。
- 需要自由输入多个 token/tag, 用 `XTokenInput`。

## XPillSelect

文件: `packages/third-ui/src/main/pill-select/x-pill-select.tsx`

### 适用场景

- 单选按钮组的胶囊版封装
- 多选按钮组的胶囊版封装
- 可选项 + 自由输入混合场景

### 参数

- `mode`
  - 含义: 选择模式。
  - 可选值: `'single' | 'multiple'`
  - 必填。
- `options`
  - 含义: 可选项数组。
  - 结构: `{ label: string; value: string }[]`
  - 默认: `[]`
- `value`
  - `single` 模式: `string`
  - `multiple` 模式: `string[]`
- `onChange`
  - `single` 模式: `(value: string) => void`
  - `multiple` 模式: `(value: string[]) => void`
- `disabled`
  - 含义: 是否禁用。
  - 默认: `false`
- `className`
  - 含义: 外层根节点样式。
  - 默认: 无
- `pillClassName`
  - 含义: 下拉面板中每个 option pill 的样式。
  - 默认: 无
- `emptyLabel`
  - 含义: 未选择时的占位文本。
  - 默认: 未传则可能显示空白占位区域
- `maxPillWidthClassName`
  - 含义: 已选 pill 和 option 文本的最大宽度 class。
  - 默认: `max-w-[180px] sm:max-w-[220px]`
- `size`
  - 含义: 尺寸。
  - 可选值: `'default' | 'compact'`
  - 默认: `'default'`
- `inputEnabled`
  - 含义: 是否允许在下拉面板中输入新值。
  - 默认: `false`
- `inputPlaceholder`
  - 含义: 输入框占位符。
  - 默认: 无
- `onInputTransform`
  - 含义: 输入值提交前的转换函数。
  - 默认: 无
- `allSelectedLabel`
  - 含义: 多选全选时, 用一个聚合 pill 替代所有 pill 的文案。
  - 默认: 未传时为 `全部`
- `maxVisiblePills`
  - 含义: 多选模式下, 最多展示多少个已选 pill, 超出显示 `+N`。
  - 默认: 不限制
- `allowClear`
  - 含义: 再次点击已选项时是否可清空。
  - 仅在 `single` / `multiple` 模式可传。
  - 默认: 不传时视为 `false`

### 默认行为

- 点击主区域会展开 / 收起下拉面板。
- 点击外部会自动收起。
- `single` 模式选择后自动收起。
- `multiple` 模式选择后不自动收起。
- `inputEnabled` 时, 输入框按 `Enter` 提交。
- 输入值会自动去掉逗号并 `trim()`。
- 多选值会自动去重。
- 选中项会显示在主区域中, 未选中时显示 `emptyLabel`。

### 默认样式

- 主区域: 圆角整丸 `rounded-full`
- 主区域边框: 默认浅边框, hover/open 时切到主题边框色
- `default` 尺寸: `min-h-11 px-4 py-2.5`
- `compact` 尺寸: `min-h-9 px-3 py-1.5`
- 已选 pill: 主题背景 + 主题文字色
- option pill: 中性灰背景；选中后切换到主题背景/边框/文字
- 下拉面板: 大圆角、浅边框、阴影

### 可自定义项

- `className`
  - 适合改根容器宽度、布局、外边距
- `pillClassName`
  - 适合改面板内 option pill 的背景、边框、hover、圆角
- `maxPillWidthClassName`
  - 适合控制 pill 文本截断宽度
- `size`
  - 适合切紧凑型布局
- `emptyLabel` / `allSelectedLabel`
  - 适合控制未选和全选文案
- `inputEnabled` / `inputPlaceholder` / `onInputTransform`
  - 适合做“半预设 + 半自由输入"场景

### 强约束

- 主触发区本身没有单独暴露 `triggerClassName`, 不能直接只改外层按钮本体样式。
- 已选中的 pill 样式没有单独暴露 `selectedPillClassName`, 只能跟随内部默认主题风格。
- 下拉面板容器样式没有单独 props, 无法直接只改面板背景/边框/阴影。
- `single` 模式选中后自动关闭, 这是固定行为。
- 输入提交规则固定为 `Enter` 提交, 不支持传分隔符策略。

### 示例

```tsx
<XPillSelect
  mode="single"
  value={status}
  onChange={setStatus}
  options={[
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ]}
  emptyLabel="Select status"
  pillClassName="rounded-md border border-neutral-300 hover:bg-neutral-100"
  className="w-full max-w-[320px]"
/>
```

```tsx
<XPillSelect
  mode="multiple"
  value={tags}
  onChange={setTags}
  options={tagOptions}
  maxVisiblePills={3}
  allSelectedLabel="All tags"
  inputEnabled
  inputPlaceholder="Add tag"
  onInputTransform={(value) => value.toLowerCase()}
/>
```

## XFilterPills

文件: `packages/third-ui/src/main/pill-select/x-filter-pills.tsx`

### 适用场景

- 筛选器 UI
- 上方一个小标题, 下方一个紧凑型单选胶囊

### 参数

- `label`
  - 含义: 筛选项标题。
- `value`
  - 含义: 当前值。
- `options`
  - 含义: 可选项。
- `onChange`
  - 含义: 值变化回调。
- `allLabel`
  - 含义: 自动插入到第一个位置的“全部"选项文案。
- `className`
  - 含义: 外层容器样式。

### 默认行为

- 内部固定使用 `XPillSelect mode="single"`。
- 自动将 `{ label: allLabel, value: '' }` 插入 options 首位。
- 固定使用 `size="compact"`。
- 已选 pill 最大宽度更小: `max-w-[150px] sm:max-w-[220px]`

### 可自定义项

- 只能通过 `className` 改外层布局。
- 更深层的 pill 样式当前没有继续透传。

### 强约束

- 这是轻封装, 适合快速使用, 不适合深度换肤。
- 如果要自定义 pill 细节, 直接改用 `XPillSelect`。

### 示例

```tsx
<XFilterPills
  label="Status"
  value={status}
  onChange={setStatus}
  allLabel="All"
  options={[
    { label: "Active", value: "active" },
    { label: "Paused", value: "paused" },
  ]}
  className="w-[220px]"
/>
```

## XFormPills

文件: `packages/third-ui/src/main/pill-select/x-form-pills.tsx`

### 适用场景

- 表单字段型单选
- 带 label、空态文案、可选清空

### 参数

- `label`
  - 含义: 字段标题。
- `value`
  - 含义: 当前值。
- `options`
  - 含义: 可选项。
- `onChange`
  - 含义: 值变化回调。
- `emptyLabel`
  - 含义: 未选择时占位文案。
- `allowClear`
  - 含义: 再次点击已选项时是否清空。
  - 默认: `false`
- `className`
  - 含义: 外层容器样式。

### 默认行为

- 内部固定使用 `XPillSelect mode="single"`。
- 透传 `allowClear`。
- 已选 pill 最大宽度: `max-w-[150px] sm:max-w-[220px]`

### 可自定义项

- 只能改外层容器。
- 如果要改具体 pill 风格, 直接使用 `XPillSelect`。

### 示例

```tsx
<XFormPills
  label="Category"
  value={category}
  onChange={setCategory}
  emptyLabel="Select category"
  allowClear
  options={[
    { label: "Article", value: "article" },
    { label: "News", value: "news" },
  ]}
/>
```

## XTokenInput

文件: `packages/third-ui/src/main/pill-select/x-token-input.tsx`

### 适用场景

- 输入多个标签、关键词、域名、邮箱片段等
- 可视化 token/tag 输入
- 可归类为“输入式按钮"

### 参数

- `value`
  - 含义: 当前 token 数组。
  - 必填。
- `onChange`
  - 含义: token 变化回调。
  - 必填。
- `placeholder`
  - 含义: 没有 token 时输入框占位符。
  - 默认: 无
- `emptyLabel`
  - 含义: 没有 token 时输入框下方提示文案。
  - 默认: 无
- `disabled`
  - 含义: 是否禁用。
  - 默认: `false`
- `className`
  - 含义: 外层容器样式。
  - 默认: 无
- `maxPillWidthClassName`
  - 含义: token pill 最大宽度 class。
  - 默认: `max-w-[180px] sm:max-w-[220px]`
- `size`
  - 含义: 尺寸。
  - 可选值: `'default' | 'compact'`
  - 默认: `'default'`

### 默认行为

- 输入按 `Enter` 提交 token。
- 失焦时自动提交当前 draft。
- 空输入按 `Backspace` 时会删除最后一个 token。
- token 自动去掉逗号、去首尾空格、自动去重。
- 点击整个区域会聚焦输入框。
- 每个 token 自带删除按钮。

### 默认样式

- 容器: `rounded-3xl`, 不是 `rounded-full`
- `default` 尺寸: `min-h-11 px-4 py-2.5`
- `compact` 尺寸: `min-h-9 px-3 py-1.5`
- token pill: 主题背景 + 主题文字色
- 删除按钮: 小圆形 hover 背景 + focus ring

### 可自定义项

- `className`
  - 适合改整体宽度、布局、外边距
- `maxPillWidthClassName`
  - 控制 token 文本截断宽度
- `size`
  - 切换紧凑模式

### 强约束

- token pill 样式没有单独 `pillClassName`, 不能直接定制每个 token 的背景/边框。
- 输入框样式没有单独 `inputClassName`。
- 删除按钮样式没有单独 props。
- token 提交和删除交互是固定策略。

### 示例

```tsx
<XTokenInput
  value={keywords}
  onChange={setKeywords}
  placeholder="Type and press Enter"
  emptyLabel="Add one or more keywords"
  className="w-full max-w-[420px]"
  maxPillWidthClassName="max-w-[120px]"
/>
```

```tsx
<XTokenInput
  value={domains}
  onChange={setDomains}
  size="compact"
  placeholder="Add domain"
  className="max-w-[320px]"
/>
```

## AI 使用建议

- 要快速做“胶囊单选/多选", 优先 `XPillSelect`。
- 要快速做“筛选器"或“表单字段", 优先 `XFilterPills` / `XFormPills`。
- 要自由输入多个值, 优先 `XTokenInput`。
- 如果需求强调“每个已选 pill 的背景、边框、hover 都要高度可配置", 当前这组组件开放度一般, 可能需要补 props 或改源码。
- 如果需求只是改宽度、布局、option pill 样式, 优先先用现有的 `className` / `pillClassName` / `maxPillWidthClassName`。


## 例外说明

下面这些交互虽然也会使用原生 `button`, 但不应机械视为“普通按钮", 不能因为想统一到底层组件就强行替换成 `GradientButton` 或 `XButton single`。

核心原则: 

- “架构同源"不等于“所有点击控件都必须长得像 CTA"。
- 如果某个控件的主要价值在于结构、定位、尺寸、状态切换、局部 hover、可访问性语义, 而不是“按钮视觉", 就要优先保留合适的原生写法或单独封装专用基座。
- 判断时优先看它是不是“业务操作按钮", 而不是只看它是不是 `button` 标签。

### Tooltip 触发按钮

特点: 

- 通常是超小号 icon-only 按钮。
- 常与 `role="tooltip"`、`aria-label`、`peer-hover`、`peer-focus-visible` 等结构联动。
- 重点在可访问性和悬浮层触发, 而不是按钮本体视觉。
- 常常需要非常轻的 hover, 不应有强 CTA 感。

不建议直接替换的原因: 

- `GradientButton` / `XButton` 默认尺寸、内边距、圆角、字体、loading 逻辑都偏重。
- icon-only 时, 底层通用按钮未必天然暴露足够好的 `aria-label`、尺寸、纯图标语义支持。
- 替换后容易破坏 tooltip 的定位、触发区域和视觉密度。

当前项目经验: 

- `InfoTooltip` 使用了小型圆形原生按钮触发 tooltip。
- 这是典型“结构型触发器", 不是普通业务按钮。
- 此类场景优先保留原生按钮, 或者未来单独沉淀 `IconButton` / `TooltipTriggerButton` 基座。

### Icon-only 按钮

特点: 

- 只有图标, 没有正文。
- 常用于设置、关闭、打开预览、切换视角、复制、更多操作等。
- 交互密度高, 经常要求 `h-5` 到 `h-10` 的小尺寸。
- 语义依赖 `aria-label`、`title`、`aria-pressed` 等属性。

不建议直接替换的原因: 

- 通用 CTA 按钮默认是“图标 + 文本"的心智模型。
- 强行用通用按钮承载 icon-only, 容易出现尺寸变大、空白过多、视觉失衡。
- 某些按钮还带切换态, 如 `aria-pressed`, 更像控制器而不是普通按钮。

当前项目经验: 

- 预览视图切换、放大预览、设置、关闭弹层等都属于这一类。
- 如果只是少量使用, 保留原生按钮比滥用 CTA 组件更稳。
- 如果后续项目里此类场景持续增多, 应新增专门的 `IconButton` 基座, 而不是继续拿 `GradientButton` / `XButton` 硬套。

### 小型控制按钮

特点: 

- 尺寸很小, 通常嵌在局部区域内。
- 往往承担局部控制动作, 如展开/收起、删除一项、标记正确项等。
- 和周围内容关系非常紧, 不适合有很强的按钮存在感。

不建议直接替换的原因: 

- 通用按钮的默认 `min-width`、排版和 loading 行为会放大局部控件。
- 这类控件往往只需要轻 hover、轻边框、轻反馈, 不需要 CTA 风格。
- 某些局部控制还需要阻止冒泡、与父容器点击行为配合。

一些项目经验: 

- “标记正确 / 删除选项 / 展开收起"就是局部控制按钮。
- 它们依赖列表项结构和局部状态, 不应直接替换为通用 CTA。

### 输入框尾部清空按钮

特点: 

- 位置通常是输入框内部的绝对定位按钮。
- 体积小, 目标是辅助输入, 而不是主交互。
- 需要与 input 的 padding、focus、错误态边框一起工作。

不建议直接替换的原因: 

- 通用按钮会破坏输入框内部的空间分配。
- 默认外层容器、圆角、边框、最小宽度都会和 input 的结构冲突。
- 这类按钮实际上是输入控件的一部分, 而不是独立按钮。

一些项目经验: 

-  ID / UUID 清空按钮就是典型样例。
- 这类控件应视为“输入控件附属操作", 不是普通按钮。

### 绝对定位按钮

特点: 

- 依附在卡片、输入区、悬浮层等局部区域。
- 常见于卡片顶部、角标位置、覆盖层、浮动关闭按钮。
- 定位高度依赖具体布局和尺寸。

不建议直接替换的原因: 

- 通用按钮的默认高度、内边距、外层包裹结构可能直接破坏定位。
- 替换后容易造成挤压、错位、溢出和点击区域异常。

当前项目经验: 

- 题目卡片顶部的 ID 复制按钮就是典型绝对定位场景。
- 这类按钮在视觉上更像“标签 + 操作", 不属于普通 CTA。

### 分页 / 预览箭头

特点: 

- 主要表达“导航"而不是“提交动作"。
- 可能是纯箭头, 也可能是简短文本。
- 通常和当前页、进度、禁用态强绑定。

处理建议: 

- 文本型上一页 / 下一页, 如果尺寸不是超小、也不嵌在复杂结构里, 可以用 `XButton single variant="subtle"`。
- 纯箭头型上一题 / 下一题 / 轮播翻页 / 预览翻页, 优先保留原生按钮或专用导航按钮。

一些项目经验: 

- 文本分页按钮适合收口到 `XButton single subtle`。
- 左右箭头按钮不适合替换成普通 CTA。

### 日历格子按钮

特点: 

- 本质更接近“日期单元格选择器"而不是普通按钮。
- 需要在网格中保持统一尺寸。
- 常带选中态、已生成态、当前月/非当前月态、日期标记点等复杂状态。

不建议直接替换的原因: 

- 通用按钮的文字排版、内边距和最小宽度与日历网格天然冲突。
- 日期单元格强调的是网格一致性和状态可视化, 不是按钮风格统一。

一些项目经验: 

- 月历日期格子应继续视为“日历选择单元"

## 当前项目沉淀规则

以当前项目为经验, 后续 AI 在处理残留原生 `button` 时, 可先按下面规则判断: 

- 主 CTA、提交、保存、导出、明显强调动作: 优先 `GradientButton`。
- 普通业务按钮、次级操作、取消、校验、重置、文本型分页: 优先 `XButton single`, 需要低存在感时用 `variant="subtle"`。
- 图标触发器、tooltip 按钮、关闭按钮、设置按钮、局部微控制: 优先保留原生按钮, 或等待专用 `IconButton`。
- 输入框内按钮、绝对定位按钮、日历格子、纯箭头导航: 不要强行替换成 CTA 基座。
- 如果一个按钮的主要复杂度来自布局结构和局部交互, 而不是视觉风格, 应优先保留原生结构。