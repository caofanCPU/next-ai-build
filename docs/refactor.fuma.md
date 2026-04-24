# Fuma Refactor Design

## Background

当前这套设计的核心目的，不是立刻升级 `fumadocs`，而是先解决两个长期结构问题：

- 上层应用对 `fumadocs-*` 的直接依赖过深，导致升级被动
- MDX 解析与渲染能力过去分散在应用层，无法清晰控制能力边界与裁剪范围

在旧结构中，`ddaas` 不仅直接依赖 `fumadocs-ui` 的 Provider、Layout、组件和类型，还在应用层自行拼装 MDX 解析链与组件映射。这会导致：

- Fuma 升级时直接冲击应用代码
- 应用层承担过多底层集成细节
- MDX 能力默认偏全量，难以根据项目需要裁剪
- 后续如果替换 docs 框架，上层改动面会很大

因此，这次重构的方向不是“换一套 UI”，而是建立稳定的内部边界，让应用层只表达站点配置和能力需求，而不再直接感知 Fuma 的实现细节。

## Overall Architecture

当前代码已经收敛为三层结构：

此外，在这三层之外，还补上了一层更稳定的协议边界：

### `packages/contracts`

定位为跨包协议与规则层。

它负责：

- 定义统一的 MDX capability 语义
- 定义解析层 feature 类型
- 定义渲染层 feature 类型
- 定义 capability 到解析 / 渲染 feature 的映射规则

它不负责：

- 解析实现
- 渲染实现
- 站点业务配置

换句话说，`contracts` 解决的是“系统里如何统一表达一项 MDX 能力，以及这项能力在各实现层上应该如何被解释”，而不是“这项能力具体怎么实现”。

### `packages/local-md`

定位为内容系统内核。

它负责：

- 本地内容源读取
- frontmatter / meta schema
- Markdown / MDX 编译
- remark / rehype / shiki / math / npm / steps 等解析能力
- TOC / structured data / renderer context
- MDX 解析能力的 feature 组合与 preset 封装

它不负责：

- 站点布局
- Fuma 页面框架
- Header / Banner / Sidebar / Footer 等站点 UI
- 业务站点级组件注入

换句话说，`local-md` 解决的是“内容如何被解析和渲染为可消费的内容单元”，而不是“页面长什么样”。

### `packages/third-ui`

定位为文档 UI 与站点布局适配层。

它负责：

- Fuma Provider 封装
- Home / Docs / Blog / Legal 等页面布局封装
- Header / Banner / Footer / TOC 等站点级 UI
- MDX 展示组件封装
- 站点级 MDX 组件工厂
- Fuma 布局、组件、上下文和 UI 协议的内部适配

它不负责：

- 重型 MDX 编译链路
- 内容源扫描
- 站点业务数据组织

换句话说，`third-ui` 解决的是“解析后的内容如何以 docs 站点形态展示出来”。

### `apps/ddaas`

定位为业务编排层。

它负责：

- 站点配置
- 导航数据
- 路由与 source 目录组织
- 业务组件注入
- 统一声明本项目启用哪些 MDX capabilities

它不再直接负责：

- `RootProvider`
- `DocsLayout`
- `HomeLayoutProps`
- `DocsLayoutProps`
- `remarkMath`
- `rehypeKatex`
- Shiki transformer
- `fumadocs-ui/components/*`

换句话说，应用层现在只描述“我是谁”“我需要什么能力”“我希望页面如何配置”，而不再自己拼底层实现。

## Fuma UI Isolation

### Core Principle

应用层不应直接感知 `fumadocs-*`。

这条原则的含义不是完全禁用 Fuma，而是：

- 应用层不再直接依赖它的 Provider
- 应用层不再直接依赖它的 Layout 类型
- 应用层不再直接依赖它的组件入口
- 应用层不再直接承受它的导出路径变化和结构变化

这样做的目的，是把未来的 Fuma 升级成本尽量限制在包层，而不是传导到具体网站。

### Provider 与 Layout 的隔离

当前 Fuma 的 Provider 和布局接入已经被集中收进 `third-ui`。

这带来两个直接结果：

- 应用层不再直接 import `RootProvider`
- 应用层不再直接 import `DocsLayout` / `HomeLayoutProps` / `DocsLayoutProps`

应用层只面对 `third-ui` 暴露出的站点布局接口和配置模型，Fuma 的布局协议变化被限制在 `third-ui` 内部。

### 配置兼容层

导航配置没有被强行重写成全新的 DSL，而是保持了旧项目熟悉的字段风格，例如：

- `text`
- `url`
- `description`
- `icon`
- `type`
- `items`
- `menu`
- `secondary`
- `mobilePinned`
- `children`

这样做不是为了维持历史包袱，而是为了降低旧项目迁移成本，同时在 `third-ui` 内部吸收 Fuma 的类型和协议变化。

这层兼容配置的价值在于：

- 旧项目迁移时不需要重新学习整套菜单语义
- Fuma 后续字段变化不再直接打到应用层
- 未来如果要继续演化配置模型，也可以在包层内部渐进完成

## MDX Capability Model

### Why a Capability Model Is Needed

MDX 这条链路过去最大的问题，不是“能不能渲染”，而是“能力边界不清楚”。

如果应用层既控制解析插件，又维护全量组件映射，那么：

- 解析层和渲染层很容易错位
- 很难判断某个项目真正启用了哪些能力
- 很难做统一裁剪
- 旧项目迁移时必须重新拼底层细节

所以当前设计的重点，不是单纯下沉代码，而是建立统一的 capability / feature 模型。

### Parsing Features in `local-md`

`local-md` 已经形成解析层的 feature 模型，当前能力包括：

- `code`
- `math`
- `npm`
- `steps`

解析层 feature 的职责，是决定：

- 哪些 remark / rehype 插件进入编译链
- 哪些编译增强逻辑启用
- 哪些重型解析依赖会参与本项目的内容处理

当前 `local-md` 除了保留聚合 preset 外，也已经有了更细的物理 feature 子入口。

这意味着：

- 解析层逻辑已经不仅是“布尔开关”
- 也不仅是“单一大 preset”
- 而是已经具备更明确的模块边界

当前解析层对外已经形成两类稳定入口：

- 根入口，面向常规内容源与编译能力使用
- server / preset 子入口，面向按能力组合的解析接入

其中：

- `./server` 与 `./server/features` 负责暴露解析侧能力接入
- `./presets/fuma-docs` 负责暴露 Fuma 风格的预设组合

同时，解析层自己的 feature 类型不再由 `local-md` 独自定义，而是改为消费 `contracts` 中的统一协议类型。

这保证了：

- 应用层不需要自己再去拼 remark / rehype / Shiki 细节
- `local-md` 不需要再单独维护一套 feature 协议
- 解析实现与能力协议彼此解耦

### Rendering Features in `third-ui`

`third-ui` 已经形成渲染层的 feature 模型，当前能力包括：

- `base`
- `code`
- `math`
- `mermaid`
- `type-table`

渲染层 feature 的职责，是决定：

- 哪些 MDX 组件被注册
- 哪些展示能力可用
- 哪些 UI 组件集进入站点级 MDX 组件工厂

当前渲染层不只是逻辑上 feature 化，物理上也已经拆出了 feature 模块文件，避免所有能力继续依赖单一总入口。

当前渲染层已经区分为三类入口：

- 轻量通用 MDX 入口
- site 级 MDX 组件工厂入口
- heavy 重组件入口

这三类入口的职责分别是：

- 轻量 MDX 入口只暴露基础渲染组件和 feature 组合能力
- site 级入口负责把站点级配置组装为最终 MDX 组件表
- heavy 入口承载数学公式、Mermaid、图片放大、图片网格这类依赖较重的组件能力

此外，当前渲染层已经进一步细分出：

- `mdx/` 目录，承载客户端渲染叶子组件
- `server/` 目录，承载站点级 MDX 组件工厂与可选能力组装层
- `share/` 目录，承载客户端与服务端都可复用的公共映射能力

这样做的关键点不只是“文件拆开了”，而是把重组件从 `mdx` 总入口的物理目录中移出，避免继续维持“所有能力默认都挂在一个目录和一个总入口下”的结构惯性。

### Current Capability Layering

当前 capability 分层已经收敛为三层：

- 默认基础能力
- 业务可选能力
- 业务额外注入能力

这三层分别解决不同问题：

- 默认基础能力负责提供站点默认可用的 MDX 环境
- 业务可选能力负责打开真正有体积和功能差异的重能力
- 业务额外注入能力负责补充站点私有组件，而不是重新拼系统默认组件

### Default Base Capability

`base` 不是“只支持普通文本”的极简模式，而是站点级默认 MDX 运行环境。

当前 `base` 默认已经包括：

- 基础 Markdown / MDX 文本渲染
- 图片处理与图片放大能力
- Fuma UI 的常用基础展示组件
- Steps 标题步骤语法支持
- 常用 widgets 组件
- `SiteX` 这类站点级基础组件

这意味着以下内容不再需要业务单独声明：

- `steps`
- `fuma-ui`
- `widgets`
- `SiteX`

它们都已经被吸收进 `base` 的站点语义。

### Optional Business Capabilities

当前业务真正需要按需声明的能力是：

- `base`
- `code`
- `math`
- `mermaid`
- `type-table`
- `npm`

其中各能力在两层系统中的投影关系如下：

- `code`
  解析层启用代码块处理、Shiki 高亮与默认 transformer
  渲染层注册代码块组件与默认语言图标映射
- `math`
  解析层启用数学公式解析
  渲染层注册数学展示组件
- `mermaid`
  只作用于渲染层，注册 Mermaid 组件
- `type-table`
  只作用于渲染层，注册手写 `TypeTable` 展示组件
- `npm`
  只作用于解析层，启用安装命令语法增强

这套分层背后的原则是：

- capability 描述业务语义
- local feature 描述解析实现
- site feature 描述渲染实现

因此，业务只声明“我要什么能力”，而不再声明“我要哪些底层插件和哪些默认组件”。

### Built-in Defaults vs Business Extensions

当前模型里，需要明确区分两类组件能力：

1. 系统内建默认能力
2. 业务自行扩展能力

系统内建默认能力包括：

- `base` 自带的基础组件集
- `code` 自带的默认代码语言图标映射
- `base` 自带的 `SiteX`

业务自行扩展能力则只保留给真正的站点差异，例如：

- 额外暴露给 MDX 的业务组件
- 业务自己决定是否开放给文档作者使用的一组全局图标组件

因此当前推荐约定是：

- 代码语言图标映射属于 `code` 的内建默认，不应由业务重复维护
- `SiteX` 属于 `base` 的内建默认，不应由业务重复注册
- 全局图标这类站点自定义开放能力，可以由业务自行注入

### Unified Capability Declaration in the App

应用层不再分别维护一份“解析开关”和一份“渲染开关”，而是维护一份统一 capability 配置。

这份配置的作用是：

- 用业务视角描述本项目需要哪些 MDX 能力
- 再由映射函数分别投影到解析层和渲染层

这样做的价值在于：

- 应用层只维护一份能力声明
- 解析层和渲染层天然对齐
- 旧项目迁移时只需要切换到 capability / features 配置模型

当前 `ddaas` 已经按这套方式落地：

- 应用层维护统一的 capability 列表
- capability 的定义与映射规则统一来自 `contracts`
- 解析层能力由 capability 映射为 `local-md` feature
- 渲染层能力由 capability 映射为 `third-ui` site feature

因此，应用层现在表达的是“我要哪些能力”，而不是“我要手动 import 哪些底层包和哪些组件”。

### Capability Contract Layer

当前 capability 模型已经不再只是“应用层的一份配置约定”，而是正式沉淀成了协议层。

这层协议现在由 `packages/contracts` 承载，主要包含三类内容：

- `MdxCapability`
- `LocalMdxFeature` / `SiteMdxFeature`
- capability 到各实现层 feature 的映射规则

这一步很关键，因为它修正了一个重要边界问题：

- `contracts` 不能反向依赖 `local-md`
- `contracts` 也不能反向依赖 `third-ui`

因此，feature 类型本身也必须属于协议层，而不是属于实现层。

当前正确的依赖方向应该是：

- `contracts` 定义协议
- `local-md` 实现解析协议
- `third-ui` 实现渲染协议
- 应用层消费协议并声明能力

## Cropping and Bundling Principle

### Cropping Is Not Content-Based

裁剪的依据不是“文档里有没有用到某种语法”，而是“某种能力在代码层面是否被声明和引入”。

这意味着：

- 文档里没有数学公式，不代表 math 相关代码一定不会进入产物
- 文档里没有 Mermaid，不代表 mermaid 相关依赖一定不会进入产物
- 真正决定能否裁剪的是模块引用边界和能力组合方式

### Cropping Must Cover Both Parsing and Rendering

当前设计明确区分了两层裁剪：

1. 解析层裁剪
2. 渲染层裁剪

如果只裁剪其中一层，会出现两类问题：

- 解析链没启用，但渲染组件仍然被带入
- 渲染组件没注册，但解析依赖仍然进入构建链

所以真正有效的裁剪必须同时控制：

- 哪些解析 feature 被启用
- 哪些渲染 feature 被启用

### Why Physical Module Boundaries Matter

仅仅使用布尔开关并不等于真正可裁剪。

布尔开关只能表达：

- 运行时不启用某能力

但它未必能表达：

- 构建时该能力不被引入

因此，当前设计特别强调物理模块边界：

- `contracts` 具有 capability / feature 协议入口
- `local-md` 具有 server 子入口与 preset 子入口
- `third-ui` 具有 site 工厂子入口、optional feature 组装层、share 公共层，以及独立的 heavy 组件目录
- feature 模块内部尽量直接依赖具体文件，而不是回到总出口

这样做的价值在于：

- 模块依赖关系更清晰
- 更接近真正的按入口裁剪
- 后续如果继续优化产物体积，已有结构可以直接复用

当前裁剪模型的实现原理可以明确概括为：

1. 应用层声明 capability
2. capability 分别映射到解析 feature 和渲染 feature
3. `local-md` 只组装被声明的解析能力
4. `third-ui` 的 site 工厂只组装被声明的渲染能力
5. 重能力组件通过独立物理目录和独立入口参与引用

这里真正影响最终产物的，不是文档内容本身，而是“某个能力是否进入了模块依赖图”。

也就是说：

- 如果 capability 中没有 `math`，则解析链不应启用数学插件，渲染层也不应注册数学组件
- 如果 capability 中没有 `mermaid`，则站点级 MDX 组件工厂不应把 Mermaid 组件并入最终组件映射
- 如果业务只使用基础 Markdown，则应用层可以把能力声明压缩到最小集合

这就是当前这套设计能支持按需裁剪的核心原因。

### Capability to Feature Mapping

应用层维护统一 capability 配置之后，裁剪流程实际变成：

1. 应用层声明能力
2. capability 映射到解析层 feature
3. capability 映射到渲染层 feature
4. `local-md` 和 `third-ui` 分别组装所需能力

这种模式的关键好处是：

- 裁剪入口统一
- 各层职责清晰
- 应用层不再承担能力编排细节

## Current Design Highlights

当前代码设计已经具备以下几个稳定特征：

- Fuma Provider 和 Layout 已经隔离到 `third-ui`
- 应用层菜单配置维持兼容字段风格
- 应用层不再直接拼 MDX 解析链
- 应用层不再维护全量 MDX 组件注册表
- capability / feature 类型与映射规则已经沉淀到 `contracts`
- 解析层和渲染层都已经 feature 化
- 应用层已经收敛成一份统一 capability 配置
- `local-md` 与 `third-ui` 都具备更细的物理子入口
- `third-ui` 的重型 MDX 组件已经从 `fuma/mdx` 目录中拆出，收敛到独立的 `fuma/heavy`
- site 级 MDX 使用已经收敛到独立工厂入口，而不是继续依赖一个“什么都导出”的总入口

这意味着当前结构已经不再是“把代码搬到包里”，而是已经形成了可持续演化的边界模型。

从实际消费关系上看，当前推荐约束已经很明确：

- 应用层声明能力，不直接拼底层组件
- 协议层负责定义 capability / feature 语义，不反向依赖实现包
- 站点级 MDX 接入优先走 site 工厂入口
- 重型展示能力通过 feature 控制是否注册
- 不再鼓励应用层从总入口无差别拿取所有 MDX 能力

## Old Project Migration Guidance

旧项目接入这套设计时，重点不再是重新实现底层集成，而是切换到 capability / feature 配置模式。

### Migration Goal

迁移的理想结果应是：

- 上层应用不再直接依赖 `fumadocs-*`
- 上层应用不再直接依赖 remark / rehype / shiki 细节
- 上层应用只声明需要哪些能力
- 上层应用只补充站点级差异配置
- capability / feature 的协议与映射规则由公共协议层统一提供

### What Old Projects Still Need to Provide

旧项目通常只需要提供这些内容：

- 一份 capability 配置
- 站点级图片 fallback
- CDN base URL
- watermark 配置
- 少量额外 MDX 组件
- 可选的全局图标组件注入
- 导航数据
- 路由和 source 目录

### What Old Projects No Longer Need to Maintain

旧项目不应该继续维护这些内容：

- 自己拼 `remarkMath` / `rehypeKatex` / `shiki`
- 自己维护整份 MDX 组件工厂实现
- 自己维护代码语言到图标的映射表
- 自己注册 `SiteX`
- 自己决定 `steps` / `fuma-ui` / `widgets` 是否启用
- 自己直接接入 `RootProvider`
- 自己直接消费 `DocsLayout` / `HomeLayoutProps`
- 自己承担 Fuma 导出路径变化的成本
- 自己从总入口混合拿基础组件与重型 MDX 组件

### Migration Rules for Capability Configuration

旧项目迁移时，可以直接按下面的约定理解：

- `base` 必须声明
- `base` 一旦声明，就默认带上基础站点 MDX 能力
- 如果需要代码块高亮与代码块图标，声明 `code`
- 如果需要公式，声明 `math`
- 如果需要 Mermaid，声明 `mermaid`
- 如果需要手写类型表格，声明 `type-table`
- 如果需要安装命令语法增强，声明 `npm`

这里要特别强调几个容易误判的点：

- `steps` 不再是单独 capability
- `fuma-ui` 不再是单独 capability
- `widgets` 不再是单独 capability
- `AutoTypeTable` 不再属于当前能力模型
- `docgen` / `ts2js` 不再属于当前能力模型

也就是说，当前能力模型刻意只保留：

- 站点默认基础能力
- 真正有体积和功能差异的重能力

### Migration Rules for Business Components

旧项目迁移时，业务自定义组件应只保留在“额外注入”这一层。

推荐理解方式如下：

- 站点基础能力，由 `base` 和其他 capability 负责
- 业务私有组件，由业务在组件扩展口中自行注入

这意味着旧项目迁移后，应用层的 MDX 接入文件应尽量只做这些事情：

- 声明 capability
- 传入图片 / CDN / watermark 等站点参数
- 传入业务额外组件
- 可选传入业务自己允许暴露的全局图标组件

而不应继续在应用层做这些事情：

- 根据 capability 手动维护一套组件注册表
- 手动把默认基础组件再重复拼回去
- 手动处理代码语言图标映射
- 手动把站点默认组件塞回组件表

### Migration Cost Profile

在当前结构下，旧项目的迁移成本应该主要收敛到：

- 接口替换
- 配置迁移
- 少量站点差异补充

而不再是：

- 重写解析链
- 重写渲染层组件映射
- 逐个处理 Fuma 内部变更

## Relationship to Future Fuma Upgrade

当前设计不是为了立即升级到 `fumadocs 16.8.x`，但它已经为后续升级建立了缓冲层。

这层缓冲的意义是：

- 升级时主要影响 `third-ui` 和 `local-md`
- 应用层尽量不直接承受 Fuma 的破坏性变化
- 旧项目只要仍然使用 capability / feature 配置模型，就不需要重新拼底层

因此，后续升级 Fuma 时，重点应该放在包层适配，而不是再次回到应用层改大量直接依赖。

## Final Summary

当前这套设计已经形成了清晰的边界：

- `local-md` 负责解析
- `third-ui` 负责展示与布局
- 应用层负责配置、能力声明与业务注入

当前这套设计也已经形成了清晰的裁剪模型：

- 应用层只声明 capability
- capability 分别映射到解析层和渲染层
- 解析层和渲染层都已经具备 feature 化和更细的物理子入口

因此，这套设计的核心价值不是“把 Fuma 搬走”，而是：

- 把应用层从 Fuma 细节中解耦
- 把 MDX 能力从散乱实现收敛成统一能力模型
- 把后续升级与旧项目迁移的成本压缩到配置与适配层

## Minimal Migration Checklist

旧项目接入时，最小迁移清单如下：

1. 将应用层对 `fumadocs-*` 的 Provider 和 Layout 直接依赖替换为 `third-ui` 暴露的根壳层与布局入口。
2. 将应用层原有的导航与站点配置迁移到 `third-ui` 提供的兼容配置模型，尽量保持原字段风格。
3. 将应用层原有的 MDX 解析配置迁移为 capability / feature 配置，不再直接 import `remark-*`、`rehype-*`、`shiki`。
4. 将应用层原有的 MDX 组件注册逻辑迁移为 `third-ui` 的 site 级工厂接入，只保留站点级差异配置与额外组件注入。
5. 将应用层解析层与渲染层的能力声明统一收敛为一份 capability 配置，避免两边重复维护。
6. 站点级 MDX 接入优先使用独立 site 工厂入口，不再把重组件能力继续挂在总入口消费方式上。
7. 验证常见内容场景：
   - 普通 Markdown
   - 代码块
   - 数学公式
   - Mermaid
   - 类型表格
   - 自定义业务组件
8. 确认应用层已不再直接承担 Fuma 内部类型、导出路径和底层解析链的维护成本。
9. 确认 capability 减少后，解析链和渲染链会同步收缩，而不是只关闭展示、不关闭底层依赖接入。
