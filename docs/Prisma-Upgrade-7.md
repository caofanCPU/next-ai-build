# Prisma 7 升级说明

本文档面向当前仓库 `/Users/funeye/IdeaProjects/next-ai-build`，说明在现有架构下将 Prisma 从 `6.19.x` 升级到 `7.x` 时，哪些内容已经完成，哪些内容还需要调整，以及应该如何验证。

## 0. 从 6.x 升级到 7.8.0 的要点工作

对当前仓库来说，从 Prisma `6.x` 升级到 `7.8.0`，真正需要落地的工作可以收敛为以下几项：

1. 统一升级 Prisma 相关依赖版本。
2. 将 Prisma CLI 的数据源配置从 `schema.prisma` 移到 `prisma.config.ts`。
3. 为 Prisma CLI 显式补齐环境变量加载，不再依赖 Prisma 6 时代的隐式 `.env` 行为。
4. 保持宿主应用生成 Prisma Client、宿主应用创建运行时 client、`backend-core` 只消费宿主注入 client 的职责边界不变。
5. 验证 `prisma generate`、TypeScript、`next build` 和运行时数据库访问链路。
6. 清理脚手架和模板中的旧 Prisma 6 写法，避免新项目继续从旧配置起步。

如果聚焦到 `apps/ddaas` 主链路，这次升级的代码改动本身很小：

- 升级 `prisma`、`@prisma/client`、`@prisma/adapter-pg`
- 新增 `prisma.config.ts`
- 从 `schema.prisma` 移除 `datasource.url`

之所以能够把改造面收敛到这个程度，是因为当前仓库在升级前就已经完成了几项关键前置工作：

- 生成器已切到 `prisma-client`
- Prisma Client 已有显式 `output`
- 已使用 `engineType = "client"`
- 应用运行时已接入 `@prisma/adapter-pg`
- `backend-core` 已不再持有固定 schema 的 generated Prisma Client

因此，这次升级的重点不是重做 Prisma 架构，而是补齐 Prisma 7 的 CLI 约束，并验证现有架构在 `7.8.0` 下继续成立。

本文档基于当前仓库真实状态编写，重点围绕以下事实：

- `backend-core` 已经完成 Prisma 职责边界收敛
- Prisma Client 已经由宿主应用生成并注册给 `backend-core`
- `apps/ddaas` 已经使用 `prisma-client` generator、自定义 `output` 和 `@prisma/adapter-pg`
- 当前升级的重点已不再是 Prisma 架构重做，而是版本升级、CLI 配置补齐和真实构建验证

本文档不覆盖：

- 线上数据库结构迁移策略
- `prisma migrate` 的发布流程设计
- SQL DDL 变更本身

## 1. 当前仓库状态

当前仓库和早期 Prisma 6 升级方案相比，已经发生了几个关键变化。

### 1.1 `backend-core` 已不再生成或持有固定 Prisma Client

当前 `backend-core` 的设计已经切换到“宿主应用生成 Prisma Client，运行时注入给 `backend-core`”的模式。

对应实现可见：

- `docs/backend-core.skills.md`
- `packages/backend-core/src/prisma/prisma.ts`
- `packages/backend-core/src/services/database/prisma-model-type.ts`

这意味着：

- `backend-core` 不再依赖固定 schema 的 generated Prisma Client
- `backend-core` 不再要求自身维护一份包内 Prisma schema 作为运行时来源
- `backend-core` 的 Prisma 边界已经被收敛为 host contract，而不是 generated client nominal type

这一步对 Prisma 7 升级非常关键，因为它提前消除了大量生成路径、导出位置和 schema 绑定带来的升级阻力。

### 1.2 `apps/ddaas` 已经完成 Prisma 7 所需的大部分生成器迁移

当前 `apps/ddaas/prisma/schema.prisma` 已经是如下模式：

```prisma
generator client {
  provider   = "prisma-client"
  output     = "../src/generated/prisma"
  engineType = "client"
}
```

这说明以下工作已经完成：

- 不再使用 `prisma-client-js`
- 已显式声明 `output`
- 已采用 Rust-free 的 `engineType = "client"`

这些本来就是 Prisma 7 升级中最容易引起改造面的部分，但当前仓库已经提前完成。

### 1.3 `apps/ddaas` 运行时已使用 `@prisma/adapter-pg`

当前 `apps/ddaas/src/server/prisma.ts` 已经通过以下方式创建 Prisma Client：

- 从 `@app-prisma` 导入宿主 generated client
- 使用 `@prisma/adapter-pg`
- 将实例通过 `configureBackendCorePrisma()` 注册给 `backend-core`

这意味着：

- 运行时接入模式已经符合 Prisma 7 推荐方向
- `backend-core` 不需要为 Prisma 7 单独改造自己的 client 创建逻辑
- 升级的风险点主要收敛到版本兼容和运行时验证，而不是架构重写

## 2. 对本仓库的真实影响判断

在当前架构下，从 `6.19.x` 升到 `7.x`，影响已经明显小于早期方案。

### 2.1 不再是“架构级改造”

本次升级不再需要做以下事情：

- 不需要再把 Prisma Client 从 `backend-core` 拆出去
- 不需要再把 schema 决策权从 `backend-core` 回收到宿主
- 不需要再把 `backend-core` 从固定 `@@schema("nextai")` client 中解耦
- 不需要再把上层应用接入方式整体重写

这些工作已经完成。

### 2.2 当前还需要关注的改造面

当前真正需要关注的内容主要有四类：

1. Prisma 依赖版本统一升级到 7.x
2. Prisma CLI 的 `.env` 加载策略补齐
3. 构建裁剪和 trace 规则对 Prisma 7 的兼容性验证
4. 脚手架和文档中的旧 generator 配置清理

因此，本次升级的工作量判断更接近：

- `apps/ddaas` 主链路：小
- `backend-core`：小
- build / deploy 验证：中
- 脚手架与文档收尾：小

整体属于“升级级改造”，不再是“架构级改造”。

## 3. Prisma 7 对当前仓库仍然重要的变化

虽然大部分结构性工作已经完成，但 Prisma 7 仍有几个需要明确处理的点。

## 3.1 Prisma CLI 不再默认加载 `.env`

这是 Prisma 7 的一个关键 breaking change。

在 Prisma 6 中，很多项目默认依赖 Prisma CLI 自动加载 `.env`。到了 Prisma 7，需要显式配置环境变量加载方式。

这会影响当前仓库中的命令，例如：

- `apps/ddaas/package.json` 中的 `prisma generate`

如果不补齐这部分配置，可能出现以下问题：

- 本地 `prisma generate` 找不到 `DATABASE_URL`
- CI 中 `prisma generate` 行为与本地不一致
- 某些脚手架生成项目后，用户需要手动补环境加载逻辑

### 推荐处理方式

优先选一种明确方案并在仓库内统一：

1. 新增 `prisma.config.ts`，显式处理 schema 和环境变量加载
2. 或者在执行 Prisma CLI 前，通过脚本显式加载 `.env`

只要仓库统一，不必强求某一种具体写法，但不能继续依赖“Prisma CLI 会自动帮我兜底”。

## 3.2 Prisma 版本需要整仓统一

当前根目录 `pnpm-workspace.yaml` 中，Prisma 相关 catalog 仍然是 `6.19.x`：

- `prisma`
- `@prisma/client`
- `@prisma/adapter-pg`

升级时应统一改到同一组 7.x 版本，避免 monorepo 内 Prisma 内部版本不一致。

建议原则：

- `prisma`
- `@prisma/client`
- `@prisma/adapter-pg`

三者保持同一小版本。

如果某个包直接使用 Prisma CLI 或 Prisma runtime，也应继续通过 `catalog:` 引用统一版本。

## 3.3 构建裁剪规则需要验证，而不是想当然复用

当前 `apps/ddaas/next.config.ts` 中仍保留了一组 Prisma runtime tracing excludes，用于减少构建产物体积。

这些规则最早是围绕旧 Prisma runtime 布局形成的，例如：

- `query_engine_*`
- `query_compiler_bg.*`
- `.prisma/client/libquery_engine-*`

在当前仓库中，因为已经使用：

- `provider = "prisma-client"`
- `engineType = "client"`
- `@prisma/adapter-pg`

很多旧排除项可能只是冗余，但 Prisma 7 升级后仍然应该重新验证以下问题：

- Next build 后是否仍会打入不需要的 Prisma runtime 文件
- Vercel / serverless trace 是否仍然完整
- Prisma 查询运行时是否缺失必要依赖

这里更像“验证项”，而不是预设一定要改代码。

## 3.4 脚手架仍残留旧 generator 配置

当前 `packages/dev-scripts/src/commands/create-diaomao-app.ts` 仍然会生成：

```prisma
generator client {
  provider = "prisma-client-js"
}
```

这与当前仓库的正式 Prisma 架构已经不一致。

如果不修复，会导致：

- 新脚手架项目仍然从旧 generator 起步
- 新项目在升级 Prisma 7 时又要重复一遍已经解决过的问题

因此这部分虽然不阻塞 `apps/ddaas` 升级，但应该作为同一次升级收尾的一部分一并修复。

## 4. `backend-core` 在 Prisma 7 下的影响

## 4.1 影响已经明显降低

由于当前 `backend-core` 已经不直接依赖宿主 generated Prisma Client 的具体 nominal 类型，因此 Prisma 7 对它的影响主要集中在：

- host contract 的结构兼容性
- 事务客户端类型别名的可继续使用性
- query logger 所消费的事件字段是否保持兼容

从当前实现看，这部分风险不高。

原因是：

- `packages/backend-core/src/prisma/prisma.ts` 对 client 能力的约束是结构性的
- `packages/backend-core/src/services/database/prisma-model-type.ts` 中的 `Prisma` namespace 已经是自定义薄类型层
- `backend-core` 当前不是靠导入自己生成的 Prisma 类型维持运行时

## 4.2 需要关注的点

虽然 `backend-core` 不需要大改，但仍应验证：

- `$transaction` 的运行时行为与当前封装是否一致
- `$on('query')` 的事件结构在 Prisma 7 下是否保持兼容
- 调试日志中对 `event.params` 的解析是否仍然成立

从当前代码看，这些更像回归验证项，而不是必然改造项。

## 5. `apps/ddaas` 在 Prisma 7 下的影响

## 5.1 生成配置已经基本就绪

`apps/ddaas/prisma/schema.prisma` 当前已经满足 Prisma 7 的主要 generator 要求，因此不需要再做以下改造：

- 不需要从 `prisma-client-js` 改到 `prisma-client`
- 不需要补 `output`
- 不需要再把 generated client 改为应用私有目录导出

## 5.2 运行时初始化逻辑可以基本保留

`apps/ddaas/src/server/prisma.ts` 当前实现已经具备以下特点：

- 使用宿主自己的 generated Prisma Client
- 使用 `PrismaPg`
- 用单例方式复用 client
- 启动时注册到 `backend-core`

这套模式在 Prisma 7 下没有明显需要推翻的地方。

重点只在于版本升级后要做一次真实验证：

- 连接是否正常
- SSL 配置是否正常
- query event 是否正常
- 事务是否正常

## 5.3 `@app-prisma` alias 可以继续保留

当前 `apps/ddaas/tsconfig.json` 中：

```json
"@app-prisma": ["./src/generated/prisma/client"]
```

这类 alias 方案和 Prisma 7 并不冲突，反而更适合当前仓库。

建议继续保留，原因如下：

- 业务代码不必关心 generated 相对路径
- Prisma 生成目录调整时，影响面更小
- 宿主应用的 generated client 边界更清晰

## 6. 建议的升级范围

如果只看“让 `ddaas` 在 Prisma 7 下稳定运行”，建议把升级范围控制在以下几项。

### 必须改

- 升级 `pnpm-workspace.yaml` 中 Prisma 相关 catalog 到同一组 7.x
- 更新 lockfile
- 为 Prisma CLI 补齐显式 `.env` 加载方案
- 验证 `apps/ddaas` 的 `prisma generate`、`next build` 和运行时查询

### 建议一起改

- 更新 `packages/dev-scripts/src/commands/create-diaomao-app.ts`，改为生成当前正式使用的 Prisma generator 配置
- 复核 `apps/ddaas/next.config.ts` 中 Prisma tracing excludes 是否仍有必要或是否需要微调
- 更新相关内部文档，避免继续传播旧方案

### 当前不建议扩大范围

- 不建议借这次升级重新设计 `backend-core` 的 Prisma 抽象
- 不建议借这次升级重新引入包内 Prisma Client
- 不建议把“线上 SQL/migration 流程改造”与 Prisma 7 升级强行绑定

这些都不是当前升级的主矛盾。

## 7. 推荐的升级执行顺序

建议按以下顺序推进。

### 第一步：升级依赖版本

统一升级：

- `prisma`
- `@prisma/client`
- `@prisma/adapter-pg`

并刷新 lockfile。

### 第二步：补 Prisma CLI 环境加载

让以下命令在 Prisma 7 下具备稳定行为：

- `prisma generate`

重点保证：

- 本地执行稳定
- CI 执行稳定
- 不依赖 Prisma CLI 的隐式 `.env` 自动加载

### 第三步：本地生成与类型检查

至少验证：

- `prisma generate`
- TypeScript type-check
- `next build`

### 第四步：运行时回归

重点验证：

- 数据库连接
- 查询执行
- 事务执行
- Prisma debug query logger
- `backend-core` 相关 route 的数据库访问链路

### 第五步：构建产物和 serverless trace 验证

重点检查：

- 是否仍有多余 Prisma runtime 文件进入产物
- 是否误裁掉了 Prisma 7 运行时所需文件
- Vercel/serverless 场景下是否存在冷启动或缺文件问题

### 第六步：修正文档与脚手架

最后再清理：

- 旧升级文档
- 脚手架旧 generator 配置
- 与旧 Prisma 架构相关的误导性说明

## 8. 风险评估

结合当前仓库状态，本次升级的主要风险已经不是业务代码，而是外围工具链和运行时环境。

### 低风险

- `backend-core` 的 Prisma 边界设计
- `ddaas` 的 generated client 输出路径
- `adapter-pg` 的整体接入方式

### 中风险

- Prisma 7 CLI 不再自动加载 `.env`
- Next build / Vercel trace 对 Prisma 7 runtime 文件布局的适配
- SSL 与连接参数在升级后的真实运行表现

### 高风险项

当前没有明显的高风险“架构级阻塞项”。

如果升级失败，更可能是某个具体构建或环境细节问题，而不是当前整体设计方向错误。

## 9. 最终结论

对当前仓库来说，Prisma `6.19.x -> 7.x` 的改造已经不大了。

更准确地说：

- 大部分困难的架构工作已经提前完成
- 当前剩余任务主要是版本升级、CLI 配置补齐和构建运行时验证
- `backend-core` 不需要为了 Prisma 7 再经历一次大的职责边界重构

因此，这次升级应按“最小必要改造 + 完整验证链路”的思路推进，而不是再按早期方案去预估一轮中大型重构。

## 10. 本仓库当前建议检查清单

- `pnpm-workspace.yaml` 中 Prisma catalog 是否全部升级到同一组 7.x
- `apps/ddaas/package.json` 中 `prisma generate` 是否已经具备显式 env 加载方案
- `apps/ddaas/prisma/schema.prisma` 是否继续保持 `provider = "prisma-client"` 与显式 `output`
- `apps/ddaas/src/server/prisma.ts` 在 Prisma 7 下是否仍正常创建连接、注册 query logger、执行事务
- `apps/ddaas/next.config.ts` 中 Prisma tracing excludes 是否经过重新验证
- `packages/dev-scripts/src/commands/create-diaomao-app.ts` 是否仍在生成旧版 `prisma-client-js`
- `backend-core` 的 query logger 与事务封装是否完成 Prisma 7 回归测试
