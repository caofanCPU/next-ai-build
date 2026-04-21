# Fumadocs `local-md` 迁移问题总结

## 简要总结

这次迁移失败的核心原因，不是本地 Markdown 文件本身有问题，也不是业务页面逻辑本身复杂，而是 `@fumadocs/local-md` 并不是一个真正独立、轻量的 source 层工具。

它在实际接入时隐式要求宿主项目已经进入较新的 Fumadocs 依赖体系，至少包括：

- 较新的 `fumadocs-core`
- 与之匹配的 `fumadocs-ui`
- 与新版 `core` 对齐的 `pageTree` / framework context / 内部 API

而本项目仍然运行在深度定制过的 `fumadocs-ui@16.0.9` 体系上。为了接入 `local-md`，虽然表面上只是替换 source 实现，但实际上会逐步触发：

- `core` 强制升级
- `ui` 数据结构不兼容
- 构建链原生依赖问题
- framework context 分裂
- 旧 UI API 与新 core API 的断裂

因此，这条迁移路径在旧项目里并不是“轻量替换内容源”，而更接近于“一次整套 Fumadocs 依赖栈升级”。对已有大量旧 UI 自定义封装的项目来说，这是一条高风险路径。

所以：

> `local-md` 是否可以被设计成一个真正独立的本地内容源工具，只负责读取和解析本地文件，而不强依赖特定版本的 `fumadocs-core`、`fumadocs-ui` 或其他 Fumadocs 内部包？

## 背景

本项目原本基于 `fumadocs 16.0.9` 这一代能力运行，内容源采用旧的 `fumadocs-mdx` 生成式方案：

- `source.config.ts`
- `fumadocs-mdx/config`
- 构建生成 `@/.source`
- 业务代码再通过 `loader()` 消费生成结果

这次尝试接入的是 Fumadocs 文档中推荐的 `@fumadocs/local-md` 方案，目标是：

- 不再依赖 `source.config.ts`
- 不再依赖 `@/.source`
- 直接基于本地 `src/mdx/**` 目录读取和解析内容

从产品理解上，这本应是一种“更轻量的本地文件 source 方案”。但实际迁移下来，遇到的问题说明：**`local-md` 并不是一个真正独立的本地 Markdown 解析工具，而是深度绑定了新一代 Fumadocs 依赖体系的内容源组件。**

## 迁移前后依赖版本对比

### 原始可稳定运行的一组版本

这组版本来自项目已有依赖关系和 `CHANGELOG` 历史：

| 包名 | 原版本 |
| --- | --- |
| `fumadocs-core` | `16.0.9` |
| `fumadocs-ui` | `16.0.9` |
| `fumadocs-docgen` | `3.0.4` |
| `fumadocs-mdx` | `13.0.6` |
| `fumadocs-typescript` | `4.0.13` |

### 为接入 `local-md` 实际被迫进入的版本状态

| 包名 | 迁移中要求/实际进入 |
| --- | --- |
| `@fumadocs/local-md` | `0.1.1` |
| `fumadocs-core` | `16.8.1` |
| `fumadocs-ui` | 仍为 `16.0.9` |
| `fumadocs-docgen` | `3.0.4` |
| `fumadocs-typescript` | `4.0.13` |

### 关键事实

`local-md@0.1.1` 的 `peerDependencies` 明确要求：

- `fumadocs-core: ^16.8.0`

也就是说，**项目只要想接入 `local-md`，就必须先升级 `fumadocs-core`**。

这不是“建议升级”，而是强耦合。

### 为什么没有直接升级 `fumadocs-ui`

这里需要额外说明一个前提：

本项目没有直接升级 `fumadocs-ui`，并不是因为单纯保守或者拒绝升级，而是因为项目已经基于旧版 `fumadocs-ui` 做了较深的自定义扩展，包括但不限于：

- 自定义 Header / HomeLayout / DocsLayout 封装
- 对旧版类型定义和内部导出的依赖
- 对旧版组件行为和上下文结构的二次包装

而新版 `fumadocs-ui` 已经存在明显的破坏性更新：

- 类型定义变化
- 导出位置变化
- 组件结构和上下文契约变化

这意味着一旦升级 `fumadocs-ui`，影响就不再是“改几个 import”或者“修几处类型”，而很可能变成：

- 大量自定义组件需要重新适配
- 部分组件需要接近重写
- 还需要重新做一轮完整的页面和交互测试

因此，**不升级 `fumadocs-ui` 是一个有明确工程背景的约束，不是一个可以被简单回一句“那就升级一下 UI 包”带过的问题。**

## 预期中的 `local-md`

从工具职责来看，`local-md` 理应是：

- 扫描本地文件目录
- 解析 frontmatter
- 生成 markdown / mdx body / toc / page tree

这类工作理论上不应该强依赖：

- `fumadocs-ui`
- 某一代 `fumadocs-core/framework`
- 某一组特定版本的上下文 API

换句话说，**它本来应该是一个偏 source 层、偏 parser 层的能力，而不是一整套 Fumadocs 新版本体系的入口锁。**

## 实际遇到的问题

### 1. `local-md` 直接要求升级 `fumadocs-core`

最开始的问题不是业务代码，而是依赖结构本身：

- 旧项目稳定运行在 `fumadocs-core@16.0.9`
- `local-md@0.1.1` 要求 `fumadocs-core@^16.8.0`

这意味着：

- 还没开始迁移 source 代码
- 还没验证页面逻辑
- 就已经先被迫升级核心依赖

这说明 `local-md` 不是“可独立接入的增量能力”，而是“要求宿主项目跟进 core 版本”的新体系组件。

### 2. `PageTree` 数据结构变化，旧 `fumadocs-ui` 无法直接消费

升级 `fumadocs-core` 后，最先暴露的是 `pageTree` 的类型变化。

典型变化：

- 新版 `core` 的 `$ref` 是 `string`
- 旧版 `ui` 期望的 `$ref` 是对象结构，例如：
  - `{ file: string }`
  - `{ metaFile?: string }`

结果就是：

- `DocsLayout tree={...}` 直接类型不兼容
- 运行时也存在旧 UI 读取旧结构字段的风险

这已经说明：

- `local-md` 虽然名义上只替换 source 层
- 但它输出的数据形状已经默认宿主也进入新 core / 新 ui 协同版本

### 3. `fumadocs-docgen -> oxc-transform` 在 Turbopack 下构建失败

项目原有的 MDX 编译链中使用了：

- `remarkDocGen`
- `remarkTypeScriptToJavaScript`

其中 `remarkTypeScriptToJavaScript` 内部依赖：

- `fumadocs-docgen`
- `oxc-transform`

在接入 `local-md` 后，这些插件链被直接放到运行时 source loader 中使用。结果在 `next dev` / Turbopack 下出现：

- `non-ecmascript placeable asset`
- `oxc-transform` 动态 wasm/native fallback 无法被 Turbopack 打包
- `Module not found: Can't resolve '/tmp/oxc-transform-...'`

这类问题说明：

- `local-md` 不是单纯“读文件 + parse”
- 它把本来在生成式构建链里的复杂编译依赖，直接带进了运行时 source loader
- 一旦项目使用 Turbopack，链路中的 native/wasm 依赖就会立即暴露

### 4. `FrameworkProvider` 运行时错误

迁移过程中一度出现：

`You need to wrap your application inside FrameworkProvider`

表面上看像是 Provider 没包，实际根因是：

- `fumadocs-ui@16.0.9` 仍然带着自己的 `fumadocs-core@16.0.9`
- 项目顶层又引入了 `fumadocs-core@16.8.1`
- 最终 React Context 来源发生分裂

即：

- Provider 来自一份 `core`
- Consumer 来自另一份 `core`

这类问题非常隐蔽，而且说明了一个更严重的事实：

**只升级 `core` 而保留旧 `ui`，并不是官方真正支持的兼容路径。**

### 5. 为解决上下文分裂而统一 `core` 后，又触发旧 UI API 断裂

为了让 `fumadocs-ui@16.0.9` 也解析到 `fumadocs-core@16.8.1`，尝试过统一依赖实例。

这一步虽然能减少 Context 分裂，但又立即触发新的构建错误：

- 旧 `fumadocs-ui@16.0.9` 仍在 import `fumadocs-core/framework` 的 `createContext`
- 新 `fumadocs-core@16.8.1` 已经不再导出这个 API

于是出现：

- `Export createContext doesn't exist in target module`

这一步基本坐实了问题本质：

**`fumadocs-ui@16.0.9` 与 `fumadocs-core@16.8.1` 不是一个官方兼容组合。**

换句话说，`local-md` 并没有提供“只升级 source 层”的安全迁移路径，而是隐式要求宿主连 UI 体系也一起升级。

## 问题本质

这次迁移最核心的问题不是代码改动量，而是设计假设：

### Fumadocs 文档对 `local-md` 的隐含前提

文档默认了使用方大概率处于“新一代 Fumadocs 依赖栈”中：

- `fumadocs-core` 已升级
- `fumadocs-ui` 已升级
- 上下文 API、framework API、page tree 结构都已经同步

但实际很多项目并不是这样迁移的。

很多真实项目是：

- `ui` 层有大量自定义封装
- 旧版 `fumadocs-ui` 已被深度魔改或二次封装
- 只希望把内容 source 换成更轻量的 `local-md`

这时用户真正期望的是：

- `local-md` 作为 source 层替代品独立接入
- 最多影响 `source.config.ts` / `@/.source`
- 不要反向要求整套 Fumadocs 全量升级

### 实际情况

实际情况是：

- `local-md` 强绑定 `fumadocs-core@^16.8.0`
- `local-md` 输出的新结构与旧 `fumadocs-ui@16.0.9` 不兼容
- 一旦保留旧 UI，又会踩到 framework/context/API 断裂

因此这条迁移路径对旧版本项目并不平滑。

## 结论

### 结论一：这不是“轻量替换 source 层”的迁移

表面目标是：

- 从 `fumadocs-mdx` 迁移到 `local-md`

但实际影响范围是：

- `fumadocs-core`
- `fumadocs-ui`
- `framework context`
- `pageTree`
- `docgen` / `oxc-transform`
- Next.js / Turbopack bundling

这说明：

**`local-md` 在旧项目里的接入，本质上不是单点替换，而是一次整套 Fumadocs 版本协同迁移。**

### 结论二：`local-md` 的设计并没有很好隔离 source 层职责

按直觉，`local-md` 应该只是：

- 本地文件扫描
- markdown / mdx 解析
- 输出标准 source 结构

但现实是它通过 `peerDependencies` 和输出结构，把自己绑到了新一代 `fumadocs-core` 的实现细节上。

这导致：

- 它并不是真正“可独立接入”的本地内容源
- 它更像是“新一代 Fumadocs 内容体系的一部分”

### 结论三：对已有 `fumadocs-ui@16.0.9` 深度封装的项目，这条路风险极高

如果项目已经存在：

- 自定义 `DocsLayout`
- 自定义 Header / HomeLayout
- 自定义 TOC / Page 生成器
- 对旧 UI 的大量二次封装

那么仅仅为了接入 `local-md` 去升级 `core`，实际风险非常大：

- 类型会炸
- 构建会炸
- Context 会炸
- UI 内部 API 会炸

最终会把“source 迁移”演变成“框架底座重构”。

## 对 Fumadocs 的一个明确批评

本次迁移复盘后，可以明确提出一个批评：

> `local-md` 作为一个本地 Markdown 内容源方案，不应该强依赖宿主项目已经升级到某一代指定的 `fumadocs-core`，更不应该把 `fumadocs-ui` 的协同升级当成默认前提。

因为从职责边界看，它本来只应该负责：

- 读文件
- 解析 frontmatter
- 生成 markdown / mdx body / toc / source 数据

而不是把 source 工具隐式设计成：

- 绑定某一代 core
- 间接要求某一代 ui
- 牵连 framework context
- 牵连 runtime / bundler 行为

如果 `local-md` 真想成为“轻量方案”，那更合理的做法应该是：

- 尽量减少对内部 Fumadocs 包的强耦合
- 或者至少提供一个对旧版 `fumadocs-ui` / `fumadocs-core` 更平滑的兼容层

否则它就不是“轻量接入”，而只是“新版本体系内的推荐路径”。

## 当前判断

基于这次实际迁移过程，当前结论是：

- **对本项目这类仍运行在 `fumadocs-ui@16.0.9` 且存在大量自定义封装的代码库，不建议继续推进 `local-md` 迁移。**
- 这条路的综合成本和不确定性，已经明显超过它在文档中宣称的“轻量”收益。

更现实的选择反而是：

- 继续保留旧的 `fumadocs-mdx` 方案
- 或者未来在完整升级整套 Fumadocs 依赖后，再重新评估 `local-md`
