# Alert Dialog Skills

本说明给 AI 使用。目标是快速判断页面级弹窗应该使用哪个组件、需要传哪些信息、哪些样式和语义是组件内约束。

## 弹窗体系定义

当前通用弹窗集中在:

`packages/third-ui/src/main/alert-dialog`

统一从 `@third-ui/main` 导出。

设计原则:

- 弹窗先按交互语义划分, 不按业务文案划分。
- 组件只负责功能、交互、基础样式和风险等级表达。
- 文案全部由使用方传入, 不在基础组件里绑定翻译 key。
- 主题相关的普通主按钮跟随网站主题色。
- 风险状态通过边框、图标、按钮颜色体现, 不通过改变弹窗主体背景色体现。
- 所有弹窗标题右侧都保留 `XIcon` 关闭入口。
- 普通 Radix 弹窗使用主题化页面蒙版, 蒙版基于 `themeMainBgColor`, 不使用主题强调色 `themeBgColor`。
- 除高优先级弹窗外, 常规弹窗允许点击弹窗外部关闭。关闭语义必须明确, 不要误触发 confirm。

## 底层依赖

基础 Radix 封装位于:

`packages/base-ui/src/ui/alert-dialog.tsx`

`AlertDialogContent` 额外支持:

- `overlayClassName`
  - 含义: 自定义 overlay 样式。
  - 用途: 让业务弹窗使用主题化蒙版。
- `onOverlayClick`
  - 含义: 点击 overlay 的回调。
  - 用途: 允许部分弹窗点击外部关闭。

注意:

- 不要直接修改所有弹窗的默认 overlay 行为。高优先级弹窗仍然使用自己的强遮罩。
- 修改 `base-ui` 子路径导出后, 如果其他 workspace 包通过 `@windrun-huaiin/base-ui/*` 消费 dist 类型, 需要重新 build `base-ui`。

## 组件选择

| 组件 | 场景 | 核心语义 | 按钮 |
| --- | --- | --- | --- |
| `AdsAlertDialog` | 广告、营销、图片信息弹窗 | 展示推广内容, 可引导跳转 | 可无按钮 / 单按钮 / 双按钮 |
| `InfoDialog` | 信息提示、提醒、结果反馈 | 告知用户一件事 | 只有 confirm |
| `ConfirmDialog` | 普通确认、危险确认 | 用户需要二选一 | cancel + confirm |
| `HighPriorityConfirmDialog` | 高优先级阻断确认 | 必须立即决策 | cancel + confirm |

## 关闭行为

| 组件 | 右上角 X | 点击外部 | 点击外部回调语义 |
| --- | --- | --- | --- |
| `AdsAlertDialog` | 关闭 | 关闭 | 只关闭, 不触发 `onCancel` / `onConfirm` |
| `InfoDialog` | 关闭 | 关闭 | 只关闭, 不触发 `onConfirm` |
| `ConfirmDialog` | cancel | cancel | 触发 `onCancel` |
| `HighPriorityConfirmDialog` | cancel | 不关闭 | 不支持点击外部关闭 |

如果未来新增弹窗, 必须先明确点击外部的语义。不要默认让点击外部触发 confirm。

## 场景判断

- 只是告诉用户结果或提示信息, 用 `InfoDialog`。
- 用户需要确认是否继续普通动作, 用 `ConfirmDialog type="normal"`。
- 删除、清空、重置、移除、不可恢复操作, 用 `ConfirmDialog type="danger"`。
- 未保存离开、流程中断、丢失状态、强阻断决策, 用 `HighPriorityConfirmDialog`。
- 有图片、推广链接、营销内容, 用 `AdsAlertDialog`。
- 不要为 `delete`、`delete all`、`reset`、`clear` 分别新增基础弹窗组件, 这些属于 `ConfirmDialog type="danger"` 的不同文案。

## AdsAlertDialog

文件: `packages/third-ui/src/main/alert-dialog/ads-alert-dialog.tsx`

### 适用场景

- 广告弹窗
- 活动推广
- 图片公告
- 升级引导
- 带外链图片的营销内容

### 参数

- `open`
  - 含义: 是否打开弹窗。
  - 必填。
- `onOpenChange`
  - 含义: 打开状态变更。
  - 必填。
- `title`
  - 含义: 标题内容。
  - 必填。
- `description`
  - 含义: 描述内容。
  - 必填。
- `imgSrc`
  - 含义: 可选图片地址。
  - 可选。
- `imgHref`
  - 含义: 图片点击跳转地址。
  - 可选。
- `cancelText`
  - 含义: 取消按钮文案。
  - 可选。
- `confirmText`
  - 含义: 确认按钮文案。
  - 可选。
- `onCancel`
  - 含义: 取消回调。
  - 可选。
- `onConfirm`
  - 含义: 确认回调。
  - 可选。

### 图标

- 标题图标: `BellIcon`
- 图片加载失败图标: `ImageOffIcon`
- 关闭图标: `XIcon`

### 约束

- 广告弹窗允许右上角关闭。
- 广告弹窗允许点击外部关闭, 行为和 `XIcon` 一致。
- 点击外部只关闭弹窗, 不触发 `onCancel` / `onConfirm`。
- 按钮不是必须的。
- 图片展示优先, 不适合承载危险确认语义。

## InfoDialog

文件: `packages/third-ui/src/main/alert-dialog/info-dialog.tsx`

### 适用场景

- 信息说明
- 操作结果提示
- 功能提醒
- 轻量警告
- 成功或失败反馈

### 参数

- `open`
  - 含义: 是否打开弹窗。
  - 必填。
- `onOpenChange`
  - 含义: 打开状态变更。
  - 必填。
- `type`
  - 含义: 信息类型。
  - 可选值: `'info' | 'warn' | 'success' | 'error'`
  - 默认: `'info'`
- `title`
  - 含义: 标题内容。
  - 必填。
- `description`
  - 含义: 描述内容。
  - 必填。
- `confirmText`
  - 含义: 确认按钮文案。
  - 默认: `'OK'`
- `onConfirm`
  - 含义: 确认回调。
  - 可选。

### Type 映射

| type | 标题图标 | 边框语义 | 按钮语义 |
| --- | --- | --- | --- |
| `info` | `BadgeInfoIcon` | 蓝色信息 | 蓝色确认 |
| `warn` | `BadgeAlertIcon` | 黄色警告 | 黄色确认 |
| `success` | `BadgeCheckIcon` | 绿色成功 | 绿色确认 |
| `error` | `BadgeXIcon` | 红色错误 | 红色确认 |

### 约束

- 只有 confirm 语义, 不提供 cancel 语义按钮。
- 右上角 `XIcon` 只关闭弹窗, 不触发 `onConfirm`。
- 点击弹窗外部只关闭弹窗, 不触发 `onConfirm`。
- 弹窗主体背景保持统一, 不按 type 改背景色。
- type 差异通过边框、图标容器、图标颜色、按钮颜色体现。

## ConfirmDialog

文件: `packages/third-ui/src/main/alert-dialog/confirm-dialog.tsx`

### 适用场景

- 是否继续
- 是否提交
- 是否保存
- 是否应用设置
- 删除、清空、重置、移除等危险操作

### 参数

- `open`
  - 含义: 是否打开弹窗。
  - 必填。
- `onOpenChange`
  - 含义: 打开状态变更。
  - 必填。
- `type`
  - 含义: 确认类型。
  - 可选值: `'normal' | 'danger'`
  - 默认: `'normal'`
- `title`
  - 含义: 标题内容。
  - 必填。
- `description`
  - 含义: 描述内容。
  - 必填。
- `cancelText`
  - 含义: 取消按钮文案。
  - 默认: `'Cancel'`
- `confirmText`
  - 含义: 确认按钮文案。
  - 默认: `'Confirm'`
- `onCancel`
  - 含义: 取消回调。
  - 可选。
- `onConfirm`
  - 含义: 确认回调。
  - 可选。

### Type 映射

| type | 标题图标 | 边框语义 | 确认按钮 |
| --- | --- | --- | --- |
| `normal` | `CircleQuestionMarkIcon` | 中性 | 主题色 |
| `danger` | `CircleAlertIcon` | 红色危险 | 红色危险按钮 |

### 约束

- `normal` 和 `danger` 共用同一个组件, 不再拆 `DangerConfirmDialog`。
- 右上角 `XIcon` 按 cancel 语义处理, 会触发 `onCancel`。
- 点击弹窗外部按 cancel 语义处理, 会触发 `onCancel`。
- `normal` 类型的标题图标使用主题色: `themeBgColor` + `themeIconColor`, 不使用黑色外圈。
- 危险确认不改变主体背景色, 只改变边框、图标和确认按钮。
- 删除场景建议 `confirmText` 使用精确动作词, 例如 `Delete`、`Clear`、`Reset`, 不要都写成 `Confirm`。

## HighPriorityConfirmDialog

文件: `packages/third-ui/src/main/alert-dialog/high-priority-confirm-dialog.tsx`

### 适用场景

- 未保存内容即将丢失
- 离开当前流程
- 中断正在进行的任务
- 覆盖重要状态
- 用户必须立即做决策的阻断场景

### 参数

- `open`
  - 含义: 是否打开弹窗。
  - 必填。
- `title`
  - 含义: 标题内容。
  - 必填。
- `description`
  - 含义: 描述内容。
  - 必填。
- `cancelText`
  - 含义: 取消按钮文案。
  - 默认: `'Cancel'`
- `confirmText`
  - 含义: 确认按钮文案。
  - 默认: `'Confirm'`
- `onCancel`
  - 含义: 取消回调。
  - 必填。
- `onConfirm`
  - 含义: 确认回调。
  - 必填。

### 图标

- 标题图标: `FAQSIcon`
- 关闭图标: `XIcon`

### 约束

- 使用 `createPortal(document.body)`。
- 遮罩更强, z-index 更高。
- 尺寸、padding、标题区、描述区、footer 间距与其他弹窗保持一致。
- 右上角 `XIcon` 按 cancel 语义处理。
- 点击外部不关闭。高优先级弹窗必须让用户通过明确按钮或 `XIcon` 做决策。
- 不负责监听路由跳转、刷新、关闭 tab 等行为。那些应由 guard/hook 层处理, 弹窗只负责展示高优先级确认 UI。

## 共享样式

文件: `packages/third-ui/src/main/alert-dialog/dialog-styles.ts`

### 关键样式分层

- `dialogSurfaceClass`
  - 只管尺寸、圆角、背景、边框、padding、阴影。
  - 给普通弹窗和高优先级弹窗共同复用。
- `dialogContentClass`
  - Radix 弹窗专用。
  - 在 `dialogSurfaceClass` 基础上增加 fixed 居中定位。
- `dialogThemedOverlayClass`
  - 普通 Radix 弹窗 overlay 专用。
  - 使用 `themeMainBgColor` 作为页面级蒙版基础色。
  - 通过 `opacity` 和 `backdrop-blur` 拉开弹窗与页面背景的层次。
  - 不要使用 `themeBgColor`, 它是主题强调色浅背景, 不是页面主背景。
- `highPrioritySurfaceClass`
  - 高优先级弹窗专用。
  - 只复用 surface, 不带 fixed/translate, 避免在 flex 居中容器里二次偏移。

### 样式规则

- 普通主按钮使用 `themeButtonGradientClass` 和 `themeButtonGradientHoverClass`。
- 危险按钮固定红色语义。
- 信息类按钮按信息类型使用蓝、黄、绿、红。
- 弹窗主体背景统一, 不使用半透明状态背景。
- 状态通过边框线、图标、按钮体现。
- 标题左侧图标有背景圆时, 当前约定外圈 `size-9`, 内部图标 `size-5`。
- 右上角关闭图标保持 `size-4`。
- 亮色主题下, overlay 与页面背景应一致但略有遮罩层次; 弹窗内部使用白色背景来形成对比。
- 暗色主题下, overlay 使用更深的透明黑色/主背景, 弹窗内部使用 `dark:bg-neutral-950`。

## 图标导出规则

全局图标从:

`packages/base-ui/src/icons/index.ts`

静态导出。

如果先在 `packages/base-ui/src/components/limited-lucide-icons.ts` 增加 Lucide 图标, 还需要在 `icons/index.ts` 中:

- import raw icon, 例如 `BadgeInfo as RawBadgeInfo`
- export wrapped icon, 例如 `export const BadgeInfoIcon = createGlobalLucideIcon(RawBadgeInfo, 'BadgeInfoIcon')`
- build `base-ui`, 更新 `dist/icons/index.d.ts`

当前 Info 弹窗依赖:

- `BadgeInfoIcon`
- `BadgeAlertIcon`
- `BadgeCheckIcon`
- `BadgeXIcon`

## 按钮文案规则

基础弹窗可以提供英文 fallback, 但业务侧应传更准确的文案。

建议:

- 信息提示: `OK`、`Got it`、`Close`
- 普通确认: `Confirm`、`Continue`、`Apply`、`Save`
- 删除: `Delete`
- 清空: `Clear`
- 重置: `Reset`
- 放弃修改: `Discard`
- 离开页面: `Leave`

不要为了省事把所有危险操作都写成 `Confirm`。

## 示例

```tsx
<InfoDialog
  open={open}
  onOpenChange={setOpen}
  type="success"
  title="Saved"
  description="Your changes have been saved."
  confirmText="Done"
  onConfirm={handleDone}
/>
```

```tsx
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  type="danger"
  title="Delete this item?"
  description="This action cannot be undone."
  cancelText="Cancel"
  confirmText="Delete"
  onCancel={handleCancel}
  onConfirm={handleDelete}
/>
```

```tsx
<HighPriorityConfirmDialog
  open={open}
  title="Leave this flow?"
  description="Unsaved changes may be lost if you leave now."
  cancelText="Stay"
  confirmText="Leave"
  onCancel={handleStay}
  onConfirm={handleLeave}
/>
```
