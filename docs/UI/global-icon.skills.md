# Global Icon 使用建议

## 背景

`base-ui` 是一个通用底层包，并且会发布到 npm。

因此 icon 体系的设计前提不能是：

- 把业务可能用到的所有 icon 都收进 `base-ui`
- 每次业务缺图标时，都回到底层包补 export 并重新发版

这会直接带来几个问题：

- `base-ui` 的职责从“提供通用能力”滑向“维护业务图标仓库”
- 新增业务 icon 的成本被放大为底层包发版成本
- `limited-lucide-icons.ts` 会持续膨胀
- 业务项目会反向驱动底层包频繁补 icon

所以这个体系里最重要的边界是：

- `base-ui` 负责提供 icon 的统一样式能力、动态解析能力、少量内置 icon
- 业务侧负责管理自己的固定 icon 集合与语义映射

## 结论

推荐按以下职责拆分。

### 1. 底层包负责能力，不负责承接业务全量 icon

底层包应长期稳定提供这些能力：

- `createGlobalIcon`
- `createGlobalLucideIcon`
- `getGlobalIcon`
- `getIconElement`
- `createSiteIcon`
- 少量底层内置 icon
- 少量已经沉淀为公共能力的静态 icon export

其中：

- `createGlobalIcon` / `createGlobalLucideIcon` 用于统一样式
- `getGlobalIcon` / `getIconElement` 用于字符串到 icon 的动态解析
- `@base-ui/icons` 中的静态 icon 更适合承载底层内置 icon 或少量公共 icon

### 2. 业务侧固定 icon，应优先自己收口

业务组件里写死的 icon，不应该默认依赖 `base-ui` 补图标发版。

长期推荐方式是业务侧自己维护一个本地 icon 入口，例如：

- `src/icons.ts`
- `src/site-icons.tsx`
- `src/features/**/icons.ts`

由业务项目自己从 `lucide-react` 导入，再通过底层提供的工厂方法统一样式。

### 3. 动态字符串场景，继续走底层动态能力

以下场景适合继续使用 `getGlobalIcon` / `getIconElement`：

- MDX frontmatter 的 `icon: "Rss"`
- 站点配置、菜单配置中的 icon key
- 数据库存储的 icon key
- 需要 fallback icon 的动态解析场景

这类场景天然依赖运行时映射，本身就不追求极致 tree-shaking。

### 4. `globalLucideIcons` 继续保留，但不应作为新业务默认写法

`globalLucideIcons` 适合：

- 兼容历史代码
- 动态字典场景
- 少量需要对象索引访问的场景

但不建议在新的业务组件中继续把它作为固定 icon 的默认用法。

## 为什么不能把所有业务 icon 都放进 `@base-ui/icons`

如果设计成“业务缺什么，底层就补什么”，会有几个明显问题：

### 1. 包定位会失真

`base-ui` 会从基础组件库变成业务图标中台。

### 2. 发版链路过重

原本只是业务新增一个按钮图标，最后会变成：

1. 修改底层包
2. 发布 npm
3. 业务升级版本
4. 再开始使用

这条链路对通用底层包来说过重。

### 3. 白名单会持续膨胀

`limited-lucide-icons.ts` 如果持续承接业务新增 icon，最终只会越来越像“业务图标全集”，与“限制范围、控制成本”的初衷冲突。

### 4. 图标语义本来就应该由业务控制

例如：

- `Search` 是否对应“搜索”
- `ScanSearch` 是否表示“检索增强”
- `PanelsTopLeft` 是否代表“控制台”

这些语义映射更接近业务层，而不是底层通用包。

## 推荐使用方式

## 场景一：业务组件中的固定 icon

这是最应该与底层“补 icon 发版”解耦的场景。

推荐写法：

```tsx
import { Search, Bell, PanelLeft } from 'lucide-react';
import { createGlobalLucideIcon } from '@windrun-huaiin/base-ui/icons';

export const SearchIcon = createGlobalLucideIcon(Search, 'SearchIcon');
export const BellIcon = createGlobalLucideIcon(Bell, 'BellIcon');
export const PanelLeftIcon = createGlobalLucideIcon(PanelLeft, 'PanelLeftIcon');
```

业务组件中使用：

```tsx
import { SearchIcon, BellIcon } from '@/icons';

<SearchIcon />
<BellIcon className="size-4" />
```

特点：

- 新增 icon 不依赖底层包发版
- 保持全站统一样式
- 业务自己管理 icon 语义
- 仍然保持静态导入，打包更友好

## 场景二：业务自定义 SVG / 品牌图标

如果业务有自己的 SVG 组件，也建议通过底层能力统一一层。

```tsx
import { createGlobalIcon } from '@windrun-huaiin/base-ui/icons';
import { MyBrandSvg } from './my-brand-svg';

export const MyBrandIcon = createGlobalIcon(MyBrandSvg, 'MyBrandIcon');
```

适用场景：

- 品牌图标
- 产品专属图标
- 不在 `lucide-react` 中的自定义图标

## 场景三：frontmatter / 配置驱动的动态图标

推荐继续使用：

```ts
import { getIconElement } from '@windrun-huaiin/base-ui/icons';

icon: getIconElement
```

或：

```ts
import { getGlobalIcon } from '@windrun-huaiin/base-ui/icons';

const Icon = getGlobalIcon(iconKey);
```

适用场景：

- Fumadocs source loader
- MDX frontmatter
- 配置中心
- 菜单 schema
- 数据库中存储 icon key 的场景

这里要注意边界：

- `getGlobalIcon` 只能解析已经注册到全局集合里的 icon
- 它适合受控动态集合
- 不适合承接业务无限扩展的固定 icon 需求

## 场景四：直接使用底层已内置 icon

如果图标本来就是底层包内置的公共 icon，或者是底层维护的少量稳定 icon，可以直接从：

```ts
@windrun-huaiin/base-ui/icons
```

静态导入使用。

但这里的原则应当是：

- 用已经存在的公共 icon
- 不把这里当作业务新增 icon 的默认申请入口

## 对 `@base-ui/icons` 的正确理解

`@base-ui/icons` 的职责不是“收口所有业务 icon”，而是：

- 导出底层的 icon 能力
- 导出少量底层内置 icon
- 导出少量已经沉淀为公共能力的静态 icon

换句话说，它是：

- 公共基础 icon 入口

而不是：

- 业务全量 icon 入口

## 对 `limited-lucide-icons.ts` 的建议

`limited-lucide-icons.ts` 不建议立刻删除，但应明确职责收敛。

更合适的定位是：

- 作为底层受控的动态 icon 集合
- 作为 `getGlobalIcon` 的已知可解析范围
- 作为 fallback icon 和少量基础 icon 的来源
- 作为兼容历史代码的过渡层

不建议继续把它当作“业务图标白名单中心”长期扩展。

## 新代码建议

对于新代码，建议直接遵守下面这组规则。

### 业务固定 icon

优先：

- `lucide-react` + `createGlobalLucideIcon`
- 或业务自定义 SVG + `createGlobalIcon`

不优先：

- 因为缺 icon 而推动 `base-ui` 补导出并发版
- 在新业务组件里默认使用 `globalLucideIcons.Xxx`
- 在固定图标场景里使用 `getGlobalIcon('Xxx')`

### 动态 icon

优先：

- `getGlobalIcon`
- `getIconElement`
- `createSiteIcon`

适用前提：

- icon 来源是字符串
- icon 集合是受控的
- 需要 fallback

### 公共内置 icon

优先：

- 直接使用 `@base-ui/icons` 已经提供的静态导出

适用前提：

- 该 icon 本来就是底层公共能力的一部分
- 或已经被多个业务证明值得沉淀到公共包

## 一句话总结

这个体系的推荐主路径应当是：

- 固定业务 icon：业务自己 `lucide-react` + `createGlobalLucideIcon`
- 动态字符串 icon：底层 `getGlobalIcon` / `getIconElement`
- 底层少量公共 icon：直接使用 `@base-ui/icons`

这样才能同时满足：

- 底层包职责稳定
- 业务新增 icon 不依赖底层发版
- 样式仍然统一
- 动态配置场景仍然可用
- 历史 `globalLucideIcons` 用法还能平滑兼容
