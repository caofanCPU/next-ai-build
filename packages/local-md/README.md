# `@windrun-huaiin/fumadocs-local-md`

`local-md` 现在的定位很明确:

- 对接 `fumadocs-core` 的内容源能力
- 支持两种内容源模式: `runtime` 和 `build`
- 以 `.source` 作为构建产物目录
- 对应用层暴露统一的取数接口与一个官方 CLI

它不再要求应用自己维护一套 MDX 构建脚本，也不要求应用直接感知内部的 MDX 构建实现。

## 设计目标

- 生产环境默认使用构建后的静态内容源，避免请求期重新解析 MD/MDX
- 开发环境默认也走构建产物，保证本地与线上行为一致
- 只有在开发期显式开启时，才回退到 `runtime` 模式，以减少频繁 build 的等待时间
- 保持组件注入发生在渲染期，由上层应用自行决定启用哪些组件能力
- `local-md` 负责“内容源处理”，`third-ui` 或应用层负责“组件渲染”

## 新架构

### 1. `runtime` 模式

`runtime` 模式会直接读取 `src/mdx` 下的源文件，并在运行期完成:

- 文件扫描
- frontmatter 解析
- remark / rehype 处理
- MDX 编译
- 页面树与页面数据组装

这个模式适合本地快速开发，但不适合线上长期承载文档访问流量。

### 2. `build` 模式

`build` 模式会先执行一次构建，把文档内容处理为 `.source` 产物。

请求期只负责:

- 读取 `.source`
- 组装 `fumadocs-core` 需要的 source 结构
- 在真正渲染页面时按需注入组件

也就是说，MDX 的重解析、remark/rehype/shiki 等重活已经前置到了构建阶段。

### 3. `.source` 目录

应用根目录下会生成:

```text
.source/
  index.ts
  blog.source.config.mjs
  docs.source.config.mjs
  legal.source.config.mjs
```

约定说明:

- `.source/index.ts` 是总索引
- 每个一级内容源目录对应一个 `.source/<sourceKey>.source.config.mjs`
- `sourceKey` 来自 `src/mdx/*` 的一级子目录名

例如:

```text
src/mdx/
  docs/
  blog/
  legal/
```

那么 CLI 会自动识别出 `docs`、`blog`、`legal` 三个内容源。

## CLI

对应用层，推荐的唯一构建入口就是:

```bash
pnpm exec local-md build
```

CLI 约定:

- 当前工作目录视为应用根目录
- 内容根目录固定为 `src/mdx`
- 自动扫描 `src/mdx` 下的一级子目录作为 source keys
- 输出固定写入应用根目录的 `.source`

这意味着应用层不需要再自己写一套“扫描目录并生成 source”的脚本。

## 应用层如何接入

应用层通常只需要两部分:

- 定义一份统一的 `local-md` source 配置
- 在取内容源时决定当前使用 `build` 还是 `runtime`

推荐策略:

- 生产环境始终使用 `build`
- 开发环境默认也使用 `build`
- 仅当显式打开开发期开关时，才使用 `runtime`

例如 `ddaas` 当前采用的是:

- `LOCAL_MD_DEV_RUNTIME=true` 且非生产环境时走 `runtime`
- 其他情况全部走 `build`

这样可以保证:

- 线上一定是静态内容源
- 本地默认与线上一致
- 需要快速改文档时，再显式切换到运行时模式

## 组件与依赖边界

这套设计里要区分两件事:

- 文档内容的“解析与编译”
- 文档页面的“组件注入与渲染”

`local-md` 负责前者，应用层或 `third-ui` 负责后者。

因此:

- `.source` 保存的是已经处理好的内容结果
- 组件注入仍然发生在页面渲染阶段
- 应用没有启用的组件能力，不需要在渲染层被强制使用

但需要注意:

- `local-md` 包本身为了完整识别和处理 MDX，内部仍会依赖相应的 MDX 编译链
- 这和“页面最终是否真的渲染某个组件”是两件不同的事

换句话说，`build` 解决的是请求期性能与稳定性问题，组件能力是否启用仍由上层控制。

## 缓存说明

即使走 `build` 模式，运行期仍然保留一层缓存。

缓存的对象不是“重新编译后的 MDX”，而是:

- `.source` 文件读取结果
- `fumadocs-core` loader 组装后的 source 结果
- 部分页面的 renderer 实例

目的很简单:

- 避免每次请求都重复读磁盘
- 避免每次请求都重复组装同一份 source 数据

如果设置:

```bash
LOCAL_MD_CACHE_DISABLE=true
```

则每次都会重新读取并重建这些运行时对象。

## 对外边界

当前对外推荐使用的能力只有两类:

- 包运行时接口
- `local-md build` CLI

内部的 `src/md-build/*` 是 `local-md` 自己使用的实现细节，不应该由应用层直接导入。

也就是说:

- 应用层不应该依赖 `./md-build`
- 应用层不应该直接调用内部 build API
- 应用层只需要执行 CLI，并在运行期读取 `.source`

## 推荐工作流

开发期:

```bash
pnpm exec local-md build
pnpm dev
```

如果只想快速改文档、临时跳过 build:

```bash
LOCAL_MD_DEV_RUNTIME=true pnpm dev
```

上线前:

```bash
pnpm exec local-md build
pnpm build
```

部署时可以选择两种方式:

- 将 `.source` 作为仓库/构建输入的一部分提交或带入构建
- 在应用正式打包前先执行一次 `local-md build`

无论哪种方式，生产环境都应读取 `.source`，不应回退到 `runtime`。
