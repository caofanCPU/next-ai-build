# local-md 兼容改造方案

## 背景

当前 `local-md` 已经完成了以下目标：

- 本地目录扫描与文档索引
- frontmatter / meta 解析
- MD / MDX 编译
- 与 `fumadocs-core` / `fumadocs-ui` 新版本对接
- 业务侧按需注入渲染组件
- 业务侧按需启用编译能力，而不是强制绑定全部能力依赖

现阶段的主要问题不在功能正确性，而在执行时机：

- 文档内容在运行期处理
- 首次访问页面时仍存在编译成本
- 线上 CPU 开销高于 build 期预处理方案
- 文档内容本质上更接近静态资源，继续保留运行期编译价值有限

因此，本次改造的目标不是重写 `local-md`，而是在保留现有解析与渲染逻辑的前提下，补齐一条 build 期 source 生成链路，并与当前 runtime source 兼容共存。

## 改造目标

本次改造需要同时满足以下目标：

- 保留当前 `local-md` 已通过验收的解析与渲染行为
- 保留业务按需启用能力、按需注入组件的模型
- 保留本地开发时的 runtime source 体验
- 新增生产可用的 build source
- 线上请求路径不再触发 MDX 编译
- 未启用的能力依赖不应进入运行时产物

换句话说，目标不是从一种 source 模型切换到另一种，而是让 `local-md` 同时支持两种 source：

- `runtime source`
- `build source`

## 核心原则

### 1. 不重写已验收的解析和渲染逻辑

当前已验收的基础逻辑必须尽量原样复用，包括：

- `storage`
- `createMarkdownCompiler`
- `createMarkdownRenderer`
- 现有 feature 开关
- 现有组件注入模型

改造重点只应放在：

- 编译结果是否预先落盘
- 页面请求时是现场编译还是读取构建产物

不应再发明一套新的 MDX 解析或页面渲染逻辑。

### 2. build 和 runtime 必须是两套物理边界清晰的入口

这是本次方案最关键的约束。

如果只是把当前运行期逻辑“提前执行一次”，但代码入口仍然混在一起，那么：

- `shiki`
- `remark/rehype`
- 数学公式能力
- 其他重型 feature 插件

仍然可能被打进线上服务端产物。

因此必须将 `local-md` 分成两个职责明确的入口：

- `build` 入口
- `runtime` 入口

其中：

- `build` 入口允许按需导入编译能力与 feature 依赖
- `runtime` 入口只能读取预生成产物，不能再 import 编译器和 feature 插件

### 3. 组件注入保留在渲染阶段，但编译能力只保留在 build 阶段

这里要明确区分两件事：

- MDX 编译能力
- MDX 组件映射

业务传入组件，本质上是渲染阶段行为。  
业务启用 `code` / `math` / `npm` 等 feature，本质上是编译阶段行为。

改造后应保持：

- 编译阶段按需启用 feature
- 渲染阶段按需注入组件

这样既能保留灵活性，也能避免运行时产物被编译依赖污染。

## 目标架构

建议将 `local-md` 调整为“双 source 模式”：

```text
开发环境:
MDX 文件
  -> runtime source
  -> 运行期编译
  -> 页面渲染

生产构建:
MDX 文件
  -> build source generator
  -> 预编译产物
  -> 运行时只读产物
  -> 页面渲染
```

更具体地说：

- 本地开发默认继续使用 `runtime source`
- 发布前执行 `build source generator`
- 线上运行时仅读取 build 产物

## 产物设计

建议为每个 sourceKey 生成独立产物目录，例如：

```text
.generated/local-md/docs/
  index.json
  pages/
    2f3a1c.mjs
    2f3a1c.json
    8a91de.mjs
    8a91de.json
```

建议包含以下内容。

### `index.json`

负责承载全局 source 信息：

- page tree
- locale 信息
- 路由映射
- frontmatter
- meta
- toc
- structuredData
- 页面产物文件名映射

### `pages/*.mjs`

用于存放预编译后的 MDX 页面模块。

适用场景：

- `.mdx`
- 需要保留模块导出的页面
- 需要运行时注入组件后再 render 的页面

### `pages/*.json`

用于存放页面附加元信息，或者给纯 Markdown 页面承载结构化结果。

## 两种 source 的职责划分

### runtime source

职责：

- 扫描目录
- 读取文件
- 解析 frontmatter / meta
- 运行期编译页面内容
- 直接返回可渲染结果

适用场景：

- 本地开发
- 文档频繁修改时的快速调试
- 不希望每次修改都重新生成 build 产物

优点：

- 改动即时生效
- 本地体验简单

缺点：

- 首次访问成本高
- 页面请求时占用更多 CPU

### build source

职责：

- 扫描目录
- 解析 frontmatter / meta
- build 期编译全部目标页面
- 将 source 与页面结果写入磁盘产物

运行时职责：

- 只读取 `index.json`
- 只动态加载预编译页面模块
- 不再触发 MDX 编译

适用场景：

- 生产环境
- 对响应稳定性和资源开销更敏感的部署环境

优点：

- 页面请求成本低
- 线上 CPU 压力更小
- 路由与 source 更稳定

缺点：

- 上线前需要显式生成 source

## 依赖裁剪原则

这是本次方案必须明确保证的重点。

你的核心要求不是“把运行期编译移到 build 期”这么简单，而是：

- 用户不需要的能力，对应依赖不应进入运行时产物

因此必须遵循以下规则。

### 1. 编译器只能存在于 build 入口

以下能力必须只属于 build 入口：

- `@mdx-js/mdx`
- `remark` / `rehype` 相关插件
- `shiki`
- `math`
- `npm install transform`
- 其他重型编译 feature

这些依赖不能再由 runtime reader 入口静态导入。

### 2. runtime 入口禁止依赖编译 feature 模块

运行时入口只能依赖：

- 产物读取逻辑
- page tree 查询逻辑
- 页面渲染适配逻辑

运行时入口不应再引用：

- `compiler.ts`
- `server/features/*`
- feature preset 聚合入口

### 3. feature 开关继续保留，但作用时机前移到 build 阶段

例如：

- 开启 `code` 才导入 `shiki` 相关 feature
- 开启 `math` 才导入数学相关 feature
- 未开启的能力不参与 build，也不进入运行时图

这样可以保留你现在已经做对的“按需能力装配”模型。

## 与现有逻辑的兼容性保证

本方案的兼容性建立在一个硬约束上：

同一页面、同一组 feature、同一组组件配置下：

- runtime compile 的结果
- build compile 的结果

应当等价。

这里的“等价”包括：

- frontmatter 一致
- meta 一致
- 路由映射一致
- toc 一致
- structuredData 一致
- 页面渲染结果一致

要做到这一点，最重要的策略不是重写，而是复用：

- 继续复用当前 `storage`
- 继续复用当前 `compiler`
- 继续复用当前 `renderer`

唯一变化是：

- runtime 模式下，页面请求时执行 compile
- build 模式下，构建阶段提前执行 compile 并落盘

## 推荐的包内结构调整

建议在 `packages/local-md` 内部明确拆出以下入口。

### 构建入口

建议新增：

- `src/build/index.ts`
- `src/build/generate-source.ts`
- `src/build/write-artifacts.ts`

职责：

- 调用 `storage`
- 调用 `compiler`
- 调用 `renderer`
- 生成并写入 `.generated/local-md/**`

### 运行时入口

建议新增：

- `src/runtime/index.ts`
- `src/runtime/read-source.ts`
- `src/runtime/load-page.ts`

职责：

- 读取 `index.json`
- 根据路由定位页面
- 按需 `import()` 预编译页面模块
- 执行渲染阶段组件注入

### 兼容入口

保留或调整现有：

- `src/server/source.ts`

职责改为：

- 提供统一的 source loader 入口
- 根据配置或环境选择 `runtime source` / `build source`

## 推荐的 API 方向

建议保留统一入口，但支持模式切换。

例如：

```ts
createLocalMdSourceLoader({
  sourceKey: 'docs',
  mode: 'runtime',
})
```

或：

```ts
createLocalMdSourceLoader({
  sourceKey: 'docs',
  mode: 'build',
})
```

也可以进一步支持自动策略：

```ts
createLocalMdSourceLoader({
  sourceKey: 'docs',
  mode: process.env.NODE_ENV === 'production' ? 'build' : 'runtime',
})
```

建议再补充一个显式构建入口：

```ts
buildLocalMdSource({
  sourceKey: 'docs',
  dir: 'src/mdx/docs',
  outDir: '.generated/local-md/docs',
  features: ['code'],
})
```

## 开发与生产推荐模式

### 本地开发

推荐：

- 默认 `runtime source`
- 不强制依赖 build 产物

好处：

- 文档改完立刻生效
- 不需要频繁跑构建命令

### 生产构建

推荐：

- CI 或发布前执行 `buildLocalMdSource`
- 生产环境只允许读取 build source

好处：

- 线上不再触发 MDX 编译
- 文档请求更稳定
- 服务端资源消耗更可控

## 实施阶段建议

为降低风险，建议按三个阶段推进。

### 第一阶段：只增加 build generator

目标：

- 不改现有 runtime 路径
- 新增 source 预编译和产物生成能力

产出：

- `.generated/local-md/**`
- 一套基础产物格式

### 第二阶段：增加 built source reader

目标：

- 可以从 `.generated/local-md/**` 读取 source
- 可以完成页面查询与渲染

此阶段仍保留 runtime 方案作为对照和 fallback。

### 第三阶段：接入双模式切换

目标：

- 统一入口自动切换 runtime / build
- dev 默认 runtime
- prod 默认 build

此阶段完成后，整套文档系统可平滑切换到生产 build source。

## 验收与回归建议

本次改造虽然不重写核心逻辑，但仍然必须做回归比对。

建议至少做以下对比：

- 同一页面的 frontmatter 是否一致
- 同一页面的 toc 是否一致
- 同一页面的 structuredData 是否一致
- 同一路由是否命中同一页面
- 同一组 components 下页面渲染结果是否一致

建议在改造期同时保留两套 source，并针对典型页面做并行验证：

- 简单 Markdown 页面
- 使用代码块的页面
- 使用数学公式的页面
- 使用自定义 MDX 组件的页面
- 多语言页面

## 风险与注意事项

### 1. 不要让 runtime reader 反向依赖 build compiler

这是最容易破坏依赖裁剪目标的点。

只要 runtime reader 仍然 import 了 compiler 或 feature 聚合入口，最终就可能把不需要的依赖重新带进运行时产物。

### 2. 产物格式要尽量稳定

一旦上线使用 build source，产物结构最好避免频繁变化，否则会影响调试、缓存和后续维护。

### 3. 先保证行为等价，再做进一步优化

本次首要目标是：

- 保留现有行为
- 降低线上成本

后续才考虑：

- 增量生成
- 更细粒度缓存
- source 变更检测

## 结论

当前 `local-md` 并不需要推翻重做。

更合理的方向是：

- 保留现有 runtime source
- 增加 build source
- 将编译能力收敛到 build 入口
- 将运行时入口收敛为纯产物读取器

这样可以同时满足以下诉求：

- 继承当前已验收的解析与渲染结果
- 保留业务按需装配能力
- 本地开发维持高效率
- 线上使用静态 build source，降低 CPU 与响应开销
- 未启用的 feature 依赖不进入运行时产物

这是当前 `local-md` 最合适、也最稳妥的兼容演进方向。
