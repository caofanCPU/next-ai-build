# local-md Vercel Page Tracing 排查总结

## 问题现象

在部分 Next.js 16 App Router 项目中：

- 本地访问 `/blog`、`/legal/terms` 正常
- 部署到 Vercel 后：
  - `/api/blog/llm-content`、`/api/legal/llm-content` 可以正常返回内容
  - `/blog`、`/legal/terms` 页面却是 404

页面侧日志表现为：

- `source.getPage(...)` miss
- `pageTree[locale]` 为空

最初怀疑过：

- middleware / locale rewrite
- slug 映射
- lazy body compile
- 空 source 被缓存

最终日志证明，这些都不是主因。

## 关键日志证据

失败项目在 Vercel page route 中的日志：

```txt
[local-md] storage:getPages:glob {
  dir: 'src/mdx/blog',
  processCwd: '/var/task',
  fileCount: 0
}
```

随后整条链路都是空：

```txt
pageFileCount: 0
sourceFileCount: 0
pageTreeLocaleCounts: { en: 0 }
```

这说明问题发生在最前面的文件发现阶段：

- `tinyglobby` 没扫到任何文件
- 不是 `getPage()` 逻辑错误
- 不是 body lazy compile 问题
- 不是缓存导致首次错误结果被复用

与此同时，API route 可以正常读到内容，说明：

- `src/mdx/blog/**/*` 并非整体不可读
- 而是 page route 对应的 server/runtime 产物没有带上这些文件

## 与 ddaas 的对比

`ddaas` 在 Vercel 上正常，日志为：

```txt
processCwd: '/var/task/apps/ddaas'
dir: 'src/mdx/blog'
fileCount: 12
```

失败项目为：

```txt
processCwd: '/var/task'
dir: 'src/mdx/blog'
fileCount: 0
```

两边应用层接法基本同构：

- `createConfiguredLocalMdSourceFactory(...)`
- `getContentSource('blog')`
- `createFumaPage({ mdxContentSource: () => getContentSource('blog') })`
- blog layout 中读取 `getContentSource('blog')`

本地 `.next` trace 结果也能看到 `src/mdx/blog/*.mdx` 已进入 trace。

因此可以排除：

- local-md 运行时逻辑差异
- 页面接入方式差异
- 本地 Next build tracing 完全失效

## 最终结论

根因是：

- `outputFileTracingIncludes` 在失败项目的 Vercel page route 上命中不充分
- 导致 page route 对应的 serverless/runtime 产物中没有稳定包含 `src/mdx/blog/**/*` / `src/mdx/legal/**/*`
- API route 命中了对应 include，所以 API 正常
- page route 没命中或命中不稳定，所以页面运行时 `glob = 0`

这不是 local-md 的缓存 bug，也不是 `process.cwd()` 本身的问题。

更准确地说：

- `process.cwd()` 只是帮助我们看到了最终运行时文件布局
- 真正的问题是 page route bundle 里没有把 mdx 文件带进去

## 为什么“暴力配置”能修好

在失败项目中，把 `outputFileTracingIncludes` 的 page route key 写宽之后，页面恢复：

```ts
outputFileTracingIncludes: {
  '/api/blog/llm-content': ['./src/mdx/blog/**/*', './src/mdx/**/*'],
  '/api/legal/llm-content': ['./src/mdx/legal/**/*', './src/mdx/**/*'],

  '/blog': ['./src/mdx/blog/**/*', './src/mdx/**/*'],
  '/blog/[[...slug]]': ['./src/mdx/blog/**/*', './src/mdx/**/*'],
  '/[locale]/blog': ['./src/mdx/blog/**/*', './src/mdx/**/*'],
  '/[locale]/blog/[[...slug]]': ['./src/mdx/blog/**/*', './src/mdx/**/*'],

  '/legal': ['./src/mdx/legal/**/*', './src/mdx/**/*'],
  '/legal/[[...slug]]': ['./src/mdx/legal/**/*', './src/mdx/**/*'],
  '/[locale]/legal': ['./src/mdx/legal/**/*', './src/mdx/**/*'],
  '/[locale]/legal/[[...slug]]': ['./src/mdx/legal/**/*', './src/mdx/**/*'],
}
```

修复后的线上日志：

```txt
processCwd: '/var/task'
dir: 'src/mdx/legal'
fileCount: 4
pageTreeLocaleCounts: { en: 3 }
```

这直接证明：

- 不是绝对路径修复了问题
- 不是 cache 修复了问题
- 就是 page route tracing include 的覆盖面变宽后，文件成功进入了 page runtime

## 当前结论的工程含义

这次问题可以定性为：

- `local-md` 这种 `glob + fs.readFile` 运行时文件发现模式，依赖 `outputFileTracingIncludes`
- 该配置在不同项目、不同 page route/function 切分下，可能需要比预期更宽的 route key 覆盖面
- `ddaas` 的精简配置能工作，不代表另一个项目一定也会稳定命中

因此：

- 不要只依赖“理论上最优雅的一个 key”
- 对 page route tracing，要以“线上实际命中稳定”为准

## 本次排查中已确认无关或次要的方向

- middleware locale rewrite 不是主因
- slug 映射不是主因
- lazy body compile 不是主因
- 空 source 缓存不是主因
  - 这是一个值得修的健壮性问题，但不是这次 404 的根因
- route group key（如 `/(content)`、`/(home)`）不是必须项
  - App Router 的 route group 不进入 URL path

## 已加入的调试能力

为便于线上定位，`packages/local-md` 已加入：

- `LOCAL_MD_DEBUG=true` 调试日志
- `runtimeInstanceId`，区分不同 runtime/module 实例
- `glob / parsed / source / loader / cache` 全链路统计日志
- 空 source warning
- 默认不缓存空 source 结果

这些日志已经足够判断：

- 是不是 page route 初始化为空
- 是不是 API route 和 page route 运行时不一致
- 是不是同一实例缓存失效

## 后续建议

短期建议：

- 保留当前可用的 `outputFileTracingIncludes` 扩大版配置
- 等线上稳定后，再逐步收缩 key，找最小有效集合

中期建议：

- 将 `local-md` 当前语义明确为：
  - build 期允许轻量 source 发现
  - runtime 期再做页面正文加载/渲染

长期建议：

- 如果不想继续依赖 Vercel page function 对原始 `src/mdx/**/*` 的 tracing 稳定性
- 可以考虑在 build 阶段生成 manifest/json
- runtime 侧读 manifest，而不是直接依赖整棵 `src/mdx` 目录



不奇怪，本质是 Next/Vercel 的 tracing 不是“按源码路由文件精确等价推导”的稳定规则，它会受项目形态影响。

  ddaas 能用较窄配置，不代表 diaomao 也一定命中。几个差异会影响最终 serverless function 怎么切、trace key 怎么匹配：

  - monorepo 根不同
    ddaas 运行时日志是类似 /var/task/apps/ddaas，diaomao 是 /var/task。process.cwd() 和文件相对布局不同，trace include 的落点也不同。
  - Vercel 对 monorepo app root 有特殊处理
    monorepo 项目通常设置 Root Directory，比如 apps/ddaas。Vercel/Next 会以这个 app root 打包函数。单工程直接是 repo root，输出结构不一样。
  - 页面函数拆分可能不同
    App Router、dynamic route、optional catch-all、locale segment、route group，在不同项目下可能被切成不同的 server function。outputFileTracingIncludes 的 key 要命中那个函数路径，命不中就不会带文件。
  - 依赖解析路径不同
    monorepo 里 @windrun-huaiin/fumadocs-local-md 可能是 workspace 源码包，单工程里是 node_modules 包。Next trace 对 workspace package 和 node_modules package 的分析路径不完全一样。
  - 缓存/构建顺序只是表象
    Turbo 已经生成 .source，说明构建顺序没问题。真正差异是 .source 是否进入最终函数包。

  所以 ddaas 的配置：

  '/[locale]/blog/[[...slug]]': ['./.source/**/*']

  能工作，说明它那边这个 key 正好命中了 page function。diaomao 不行，说明它线上实际 page function 可能没有被这个单 key 覆盖，需要加：

  '/blog'
  '/blog/[[...slug]]'
  '/[locale]/blog'
  '/[locale]/blog/[[...slug]]'

  这就是你昨天文档里总结的“不要只依赖理论上最优雅的一个 key，要以线上实际命中稳定为准”。

  短结论：
  ddaas 能跑是因为 monorepo + Vercel root + function tracing key 切分刚好命中；diaomao 是单工程，最终函数布局不同，窄 key 没稳定命中。不是 Turbo 问题，也不是 local-md 生成失败。

  确实是这样的！ 2次问题排查都是如此！