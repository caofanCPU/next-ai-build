# Global Icon 改造方案

## 目标

当前 `base-ui` 的 icon 体系承担了两类职责：

1. 统一图标样式
2. 统一图标可用范围与语义

现状的问题是：

- `globalLucideIcons` 这类“大对象 + 动态索引”的形式，不利于上层应用的 tree-shaking
- `limited-lucide-icons.ts` 作为白名单入口，导致业务项目经常反向推动 `base-ui` 补 icon 和发版
- 多项目落地后，图标语义是否统一，最终仍然更依赖业务侧自身治理

本方案的目标是：

- 保留现有 `global` 动态能力，兼容字符串配置、MDX、site config 等场景
- 新增静态导出入口，让普通业务组件可以按需导入图标
- 弱化 `base-ui` 对业务图标名单的强控，转为提供统一处理能力
- 降低后续 `base-ui` 因补 icon 而频繁发版的成本

## 结论

推荐终态如下：

- `global` 继续存在，但职责收敛为：
  - 样式统一处理
  - 动态 icon 获取
  - fallback icon
  - 少量基础内置 icon
- 新增静态导出入口，例如 `@base-ui/icons` 或 `@base-ui/components/global-icons`
- 业务组件中的固定 icon，优先走静态导入
- 字符串配置、MDX、site config 等动态场景，继续走 `getGlobalIcon` / `createSiteIcon`
- 将当前 `limited` 已使用的图标，全部同步提供为静态导出，作为第一阶段迁移快捷方式

这意味着：

- 旧代码可以继续工作
- 新代码可以获得更好的按需打包效果
- 业务侧后续可以直接对接 `lucide-react`，并用 `global` 工具做统一加工
- `base-ui` 不再承担全量业务 icon 白名单管理职责

## 为什么当前方案不利于按需打包

当前核心问题不是 `lucide-react` 本身，而是使用方式。

如果代码是：

```ts
import { Search } from 'lucide-react';
```

或者：

```ts
import { SearchIcon } from '@base-ui/components/global-icons';
```

这种是静态引用，bundler 更容易 tree-shaking。

但如果代码是：

```ts
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';

<icons.Search />
```

或者：

```ts
getGlobalIcon(iconKey)
```

这种属于：

- 大对象聚合
- 动态属性访问
- 字符串解析

bundler 通常会保守处理，导致白名单里的较多 icon 一起进入最终 bundle。

所以问题不在于是否“统一入口”，而在于是否把入口设计成了运行时大对象。

## 推荐终态 API

建议统一为一个模块入口，但保留多种导出形态。

示意：

```ts
import { SearchIcon, BellIcon, createGlobalLucideIcon, getGlobalIcon } from '@base-ui/icons';
```

其中分工如下：

### 1. 静态图标导出

给普通业务组件使用。

```ts
import { SearchIcon } from '@base-ui/icons';

<SearchIcon />
```

特点：

- 静态导入
- 更利于 tree-shaking
- 统一样式

### 2. 动态图标获取

给字符串 key 配置场景使用。

```ts
import { getGlobalIcon } from '@base-ui/icons';

const Icon = getGlobalIcon(iconKey);
```

特点：

- 兼容 MDX、frontmatter、site config、数据库配置
- 天然不适合极致 tree-shaking
- 应限制在确实需要动态解析的场景中使用

### 3. 图标加工器

给业务项目自由接入 `lucide-react` 或自定义 SVG。

```ts
import { Search } from 'lucide-react';
import { createGlobalLucideIcon } from '@base-ui/icons';

export const SearchIcon = createGlobalLucideIcon(Search);
```

或：

```ts
import { createGlobalIcon } from '@base-ui/icons';
import { MyBrandIconSvg } from './my-brand-icon';

export const MyBrandIcon = createGlobalIcon(MyBrandIconSvg);
```

特点：

- 底层只负责统一风格
- 业务侧自行决定图标语义映射
- 不必再依赖 `base-ui` 补白名单

## 关于 `limited` 的建议

建议不要立刻粗暴删除 `limited`，而是做职责降级。

### 推荐做法

- 保留 `limited-lucide-icons.ts`
- 保留 `globalLucideIcons`
- 保留 `getGlobalIcon`
- 同时把 `limited` 中已列出的图标，全部补一层静态导出版本

这一步非常重要，因为它可以把迁移成本降到最低。

例如当前如果已有：

```ts
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';

<icons.Search />
```

则迁移后可以较简单替换为：

```ts
import { SearchIcon } from '@base-ui/icons';

<SearchIcon />
```

这比要求业务侧全面改成直接接入 `lucide-react` 更平滑。

### 为什么这是第一阶段最划算的方案

原因很简单：

- 当前 `limited` 里的 icon 本来已经被项目使用过
- 把这些 icon 直接补成静态导出，几乎等于给历史使用方式提供快捷迁移入口
- 业务侧后续只需要：
  - 改 import 路径
  - 把 `<icons.Xxx />` 改成 `<XxxIcon />`
- 不需要在第一阶段就逼业务侧建立自己的完整 icon 管理体系

因此，第一阶段推荐：

- `limited` 保留
- `limited` 中全部图标提供静态导出
- 文档明确：新业务组件优先使用静态导出

## 是否需要完全放弃 `limit`

从长期来看，可以弱化，甚至停止继续扩展它的业务白名单角色。

更准确的说法不是“彻底删除”，而是：

- 不再把它当作业务 icon 管控中心
- 只把它当作：
  - 动态解析场景的核心小集合
  - 内置 fallback 和基础 icon 集合

后续新增业务 icon 的推荐方式应转为：

- 业务项目直接从 `lucide-react` 导入
- 再通过 `createGlobalLucideIcon` 做统一样式处理
- 或在业务项目自己的 `icons.ts` / `site-icon.ts` 里做语义映射

## 建议的改造结构

以下是推荐的职责拆分，命名可按项目实际调整。

### 基础样式与工厂

- `createGlobalIcon`
- `createGlobalLucideIcon`
- `patchGlobalIconProps` 或等价的内部工具

职责：

- 统一颜色
- 统一默认尺寸
- 统一 className 合并规则
- 统一内置 style 处理

### 静态导出入口

例如：

- `packages/base-ui/src/components/global-icons.ts`

职责：

- 提供命名导出的静态 icon
- 先覆盖 `limited` 已有图标
- 后续允许按需增补

### 动态 registry

例如：

- `packages/base-ui/src/components/global-icon.tsx`

职责：

- `globalLucideIcons`
- `getGlobalIcon`
- `getIconElement`
- `createSiteIcon`
- fallback icon

说明：

这个入口保留，但不再推荐作为普通业务组件的首选用法。

## 迁移策略

推荐分三阶段进行。

### 第一阶段：底层增量改造

目标：

- 不破坏现有 API
- 提供新的静态导出能力

建议动作：

1. 保留现有 `global-icon.tsx`
2. 提炼统一样式包装逻辑到独立工厂函数
3. 新增静态导出入口
4. 将当前 `limited` 中的全部图标提供为静态导出版本
5. 更新 `README` / 使用文档，明确新旧场景分工

阶段结果：

- 旧代码零破坏
- 新代码可开始使用静态导出

### 第二阶段：业务侧渐进迁移

目标：

- 把普通组件中的 `icons.Xxx` 迁移为静态导入

适合迁移的场景：

- 按钮图标
- 卡片图标
- 页面装饰图标
- 导航图标
- 固定功能图标

不急着迁移的场景：

- `site-config.ts` 这类字符串配置
- MDX frontmatter icon
- CMS / 数据库返回 iconKey
- 必须依赖字符串解析的场景

建议替换方式：

从：

```ts
import { globalLucideIcons as icons } from '@base-ui/components/global-icon';

<icons.Search />
```

改为：

```ts
import { SearchIcon } from '@base-ui/icons';

<SearchIcon />
```

注意：

- 本次文档不要求预扫描旧用法
- 后续由业务侧自行搜索 `global as icons`、`globalLucideIcons` 等模式并替换

### 第三阶段：业务语义管理下沉

目标：

- 把图标“语义统一”交给业务项目自身

推荐方式：

- 每个应用项目维护自己的 `icons.ts` / `site-icons.ts`
- 在其中集中定义业务语义映射
- `base-ui` 只负责加工和基础能力

示意：

```ts
import { Search, Bell, Settings } from 'lucide-react';
import { createGlobalLucideIcon } from '@base-ui/icons';

export const SearchIcon = createGlobalLucideIcon(Search);
export const BellIcon = createGlobalLucideIcon(Bell);
export const SettingsIcon = createGlobalLucideIcon(Settings);

export const siteIcons = {
  navSearch: SearchIcon,
  notify: BellIcon,
  preferences: SettingsIcon,
};
```

## 迁移风险与收益判断

### 收益

- 降低 `base-ui` 因补 icon 而频繁发版的成本
- 普通组件可获得更好的按需打包效果
- 统一样式能力仍然保留
- 不再强迫所有业务图标语义都上收到底层包

### 风险

- 过渡期会存在两套用法并行：
  - `globalLucideIcons`
  - 静态导出 icon
- 如果规范不清晰，团队容易继续沿用旧模式
- 如果一个组件同时混用静态导入和动态 registry，静态导入的打包收益可能被部分抵消

### 风险控制建议

- 保留旧 API，但在文档中明确标记其适用场景
- 新代码默认只推荐静态导入
- 动态解析能力仅用于确有字符串配置需求的场景

## 打包与性能的重要提示

以下信息需要在改造和发布前明确告知使用方。

### 1. `globalLucideIcons` 不等于按需导入

即使后续新增静态导出入口，只要业务组件继续使用：

```ts
import { globalLucideIcons as icons } from '...';
```

那么打包收益依然有限。

原因：

- 大对象聚合
- 动态属性访问
- 运行时解析

这些模式通常不利于 tree-shaking。

### 2. 动态字符串解析场景本来就不是最优打包模型

例如：

- `getGlobalIcon('Pi')`
- `createSiteIcon('Pi')`
- frontmatter / 配置文件中写 iconKey

这类能力应保留，但要接受其并非最优体积模型。

### 3. 真正有利于 tree-shaking 的是静态命名导入

例如：

```ts
import { SearchIcon } from '@base-ui/icons';
```

或：

```ts
import { Search } from 'lucide-react';
```

并通过工厂函数包装。

### 4. 同时混用两套方式时，收益会被削弱

如果同一页面或同一 chunk 中：

- 既用了 `globalLucideIcons`
- 又用了静态导入 icon

则该 chunk 仍可能因为动态 registry 而保留较多 icon。

因此建议：

- 普通业务组件优先纯静态导入
- 动态 registry 尽量只留给必要场景

### 5. `base-ui` 发布体积和应用最终体积不是一回事

即便 `base-ui` 自身未把 `lucide-react` 打进产物，应用在消费时仍可能因为使用方式不当而增大最终 bundle。

换言之：

- `base-ui` 包体积小
- 不代表上层应用体积一定小

真正决定最终效果的，是应用侧实际 import 方式。

### 6. 第一阶段的目标不是“极限瘦身”，而是“建立正确演进方向”

第一阶段做完后，不应期待所有页面体积立刻大幅下降。

第一阶段真正价值在于：

- 建立静态导入能力
- 降低底层白名单发布压力
- 让后续迁移有明确路径

## 发布与版本提示

建议按以下方式发布。

### 版本策略

如果只是：

- 新增静态导出入口
- 保留旧 API
- 不破坏现有行为

则可以按非破坏性版本发布。

如果后续：

- 删除 `limited`
- 删除 `globalLucideIcons`
- 修改 `createSiteIcon` 语义

则应视为破坏性变更。

### 发布说明必须强调的内容

1. 新增静态导出入口，推荐普通组件优先使用
2. 现有 `globalLucideIcons` / `getGlobalIcon` 继续保留，主要服务动态场景
3. `limited` 已有图标同步支持静态导出，便于低成本迁移
4. 新增图标样式加工能力，业务项目可直接包装 `lucide-react`
5. 如需获得更好的 tree-shaking，业务侧需要逐步替换 `icons.Xxx` 用法

## 推荐的团队约定

建议后续明确以下规则。

### 底层包负责

- icon 统一样式能力
- 少量基础 icon
- 动态解析能力
- fallback 能力

### 业务项目负责

- 业务语义与 icon 的映射
- 新增个性化 icon 的选型
- 自己项目内的统一管理入口

### 默认使用规则

- 普通 React 组件：静态导入 icon
- 配置、MDX、字符串 key：动态获取 icon
- 自定义 icon：先经由 `createGlobalIcon` / `createGlobalLucideIcon` 包装

## 最终建议

本次改造不建议走“大重构 + 一次性替换”。

推荐最小可行路径：

1. 保留现有 `global` 动态体系
2. 抽离样式工厂
3. 新增静态导出入口
4. 将当前 `limited` 已使用图标全部补成静态导出
5. 后续业务侧自行搜索旧用法并渐进替换
6. 长期将业务图标语义管理下沉到应用侧

这条路径的性价比最高，风险也最低。
