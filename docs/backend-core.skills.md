# Backend Core Host Prisma Refactor

本文记录 `backend-core` 后续的数据层边界调整方向，目标是恢复“宿主应用决定 schema 与 Prisma generate，backend-core 负责统一业务语义”的架构。

## 问题背景

当前 `backend-core` 将以下内容一起打包发布：

- core 表的 Prisma models
- 基于这些 models 生成的 Prisma Client
- 直接依赖 generated Prisma types 的 database services

这带来一个根本问题：

- Prisma Client 对 schema 的绑定是静态的
- `@@schema("nextai")` 会在 generate 时固化到 client 的查询行为里
- 宿主应用在运行时无法把这些查询改到自己的 `schema_a`、`schema_b`

因此，当前方案与以下目标冲突：

- 宿主应用自行决定数据库 schema
- 单 DB 多应用时每个应用保持 schema 隔离
- `backend-core` 仍然作为统一的业务能力包被复用

## 结论

后续架构应回归为：

- 宿主应用拥有公共表与业务表的最终 Prisma schema
- 宿主应用负责 `prisma generate`
- 宿主应用决定公共表落在哪个 schema
- `backend-core` 不再持有固定 schema 的 generated Prisma Client
- 宿主应用提供并注册自己的 Prisma Client
- `backend-core` 负责统一公共数据契约、service 语义、事务边界与公共数据访问逻辑

这样可以解决当前的 schema 权限问题：

- `backend-core` 不再固定访问 `nextai.users`
- 宿主应用自己的 Prisma Client 会访问它自己 schema 下的 `users`
- schema 权限与隔离能力完全回归宿主数据库配置

## Backend Core 的职责

调整后，`backend-core` 的核心职责应收敛为以下几类。

### 1. 统一公共表的业务语义

例如：

- 匿名用户初始化
- 用户升级与注销
- 积分初始化、扣减、发放
- 订阅状态变更
- 订单状态流转
- 审计日志记录

重点不是 CRUD，而是这些公共表之间如何协同工作。

### 2. 定义稳定的数据契约

包括：

- 核心实体类型，如 `CoreUser`、`CoreCredit`、`CoreSubscription`
- 写入 DTO，如 `CreateUserInput`、`UpdateUserInput`
- 查询参数类型
- service 返回结构
- 常量、状态枚举、错误语义

这些类型可以稳定开放给上层业务使用，但不再直接暴露 Prisma generated types。

### 3. 定义宿主 Prisma 的最小接入契约

例如：

- `BackendCoreHostPrismaClient`
- `BackendCoreTransactionClient`
- `BackendCorePrismaDelegateContract`

这层契约只约束 `backend-core` 实际需要使用的那些 Prisma delegate 与事务能力。

宿主应用只需要：

- 定义公共表 models
- 生成自己的 Prisma Client
- 在运行时把该 client 注册给 `backend-core`

公共 CRUD 封装与数据库访问行为仍由 `backend-core` 自己实现，而不是下放给每个宿主。

说明：

- host contract 中可以保留少量底层原生能力声明
- 例如 `$queryRawUnsafe`、`$executeRawUnsafe`
- 这类能力主要用于少数暂时无法优雅改写为普通 Prisma API 的统计 SQL 或数据库锁操作
- 允许保留能力声明，不代表鼓励长期扩散使用；应尽量收敛在少数明确场景中

### 4. 统一事务与编排规则

例如：

- 哪些 service 调用必须位于同一事务
- aggregate service 如何串联多个 repository
- 哪些操作需要幂等控制
- 哪些操作必须附带审计记录

这部分逻辑仍应保留在 `backend-core`。

### 5. 承载与数据库无关的通用逻辑

例如：

- route handler 的业务流程
- context 组装
- 支付与认证相关的业务编排
- 响应结构映射
- 配置约束和校验逻辑

## 宿主与 Core 的职责边界

推荐遵循以下原则：

- 公共规则归 `backend-core`
- 个性化扩展归宿主应用

具体来说：

- 宿主应用不需要关心公共逻辑的内部实现细节
- 宿主应用只负责提供自己的 Prisma Client、公共表 schema 与业务侧调用入口
- 如果宿主需要新的公共能力，应向 `backend-core` 提需求并纳入统一开发、发布新版本
- 如果宿主只是做局部定制，且不适合作为公共能力沉淀，则应在宿主应用内自行实现

这样可以保证：

- 公共能力只维护一份
- 公共 bug 修复不会分散到多个宿主重复处理
- 宿主仍然保留足够的本地扩展能力

## Backend Core 不再负责的内容

### 1. 不再决定物理 schema

`backend-core` 不再决定必须使用：

- `nextai`
- `public`
- 任何固定 schema 名

schema 应由宿主应用在自己的 Prisma schema 中决定。

### 2. 不再持有宿主最终使用的 Prisma generated client

原因：

- generated client 对 model 与 schema 是静态绑定的
- 一旦由 `backend-core` 打包发布，就无法兼容多宿主、多 schema 的运行时差异

## 运行时协作方式

推荐的运行时边界如下：

1. 宿主应用定义公共表 models 与自己的业务表 models。
2. 宿主应用在自身 schema 中生成 Prisma Client。
3. 宿主应用在运行时将自己的 Prisma Client 注册给 `backend-core`。
4. `backend-core` 内部基于该 host Prisma Client 执行统一的数据访问逻辑。
5. `backend-core` 的 services / aggregate / routes 继续由 `backend-core` 自己维护。

这意味着：

- `backend-core` 不需要在编译期认识宿主 Prisma 的 generated types
- 宿主 Prisma 查询结果由 `backend-core` 内部的映射层收敛成 core 类型
- `backend-core` 内部全部围绕 core 契约工作

## 类型边界原则

`backend-core` 不应继续直接使用以下类型作为公共边界：

- `Prisma.TransactionClient`
- `Prisma.UserUpdateInput`
- `Prisma.UserWhereInput`
- `User` / `Credit` / `Subscription` 这类 generated model types

应改为：

- `CoreTransaction`
- `CoreUser`
- `CreateUserInput`
- `UpdateUserInput`
- `UserQuery`

`backend-core` 内部负责完成：

- Prisma row -> Core entity
- Core DTO -> Prisma data

这层映射通常是薄映射，不承载复杂业务规则。

## 对现有接入方的影响判断

以 `apps/ddaas` 为例，当前接入面主要集中在：

- 直接 re-export `backend-core` 的 route
- 少量组件直接调用 database service
- 极少量地方直接依赖 `@core/prisma` 类型

因此本次改造的主要工程量集中在 `backend-core` 内部，而不是应用侧大面积业务代码。

预期影响：

- `backend-core`：中等偏大改造
- 已接入业务应用：小到中等改造

只要保持上层主要 service API 不发生无谓震荡，宿主应用改动可以控制在初始化与少量类型替换层面。

## 宿主应用接入要点

业务侧接入或升级时，重点关注以下内容。

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `apps/<app>/prisma/schema.prisma` | 同时定义公共表与应用自己的业务表 | 公共表 schema 由宿主决定，不再由 `backend-core` 固定。generator 使用 `prisma-client`、`engineType = "client"`、`output = "../src/generated/prisma"`。 |
| `apps/<app>/tsconfig.json` | 保留应用 Prisma alias | 推荐保留 `@app-prisma -> ./src/generated/prisma/client`，避免业务代码直接写 generated 相对路径。 |
| `apps/<app>/package.json` | 保证 `dev/build` 前生成应用 Prisma | `prisma generate` 仍应保留在宿主应用自己的构建链路中。 |
| `.gitignore` | 忽略应用 Prisma generated | 使用 `apps/*/src/generated/prisma/`。应用 generated Prisma 不提交。 |
| `apps/<app>/src/server/prisma.ts` | 创建并注册宿主 Prisma Client | 宿主应用需要在这里创建自己的 Prisma client，并通过 `configureBackendCorePrisma()` 注册给 `backend-core`。 |
| `apps/<app>/src/app/api/**/route.ts` | 确保在使用 core route 前完成 Prisma 注册 | 如果 route 直接 re-export `backend-core` route，应先引入宿主的 `server/prisma`。 |
| `apps/<app>/src/server/services/*` | 保留宿主本地 service | 宿主既可以调用 `backend-core` service，也可以用自己的 Prisma client 写本地业务逻辑。 |
| `apps/<app>/next.config.*` | 保留 Prisma tracing excludes | 需要继续保留与 PostgreSQL query compiler 相关的 tracing 配置，避免 serverless trace 缺文件。 |
| 环境变量 | 可选开启 `PRISMA_DEBUG=true` | 开启后可排查 query listener、实例复用和 SQL 耗时。 |

## 宿主 Prisma 生成配置

宿主应用推荐使用如下 generator 形式：

```prisma
generator client {
  provider   = "prisma-client"
  output     = "../src/generated/prisma"
  engineType = "client"
}
```

说明：

- `engineType = "client"` 是 Prisma 6 的 Rust-free 方案
- 配合 `@prisma/adapter-pg` 后，Vercel / Next function trace 不再携带旧 Rust query engine 大包
- `backend-core` 自身不再生成 `core-prisma`，Prisma generated client 由宿主单独负责

## Runtime 与事务约定

当前运行时协作模式下，`backend-core` 与宿主共享的是同一份宿主 Prisma client。

常见 service 仍保持如下签名：

```ts
method(..., tx?: Prisma.TransactionClient)
```

内部仍统一通过：

```ts
const client = checkAndFallbackWithNonTCClient(tx);
```

规则：

- 传入 `tx` 时，所有操作走同一个 transaction client
- 未传 `tx` 时，fallback 到已注册的宿主 Prisma client
- aggregate service 通过 `runInTransaction()` 基于宿主 Prisma client 开启事务

因此，事务链路中的所有 core service 调用都必须继续传递同一个 `tx`。

示例：

```ts
return runInTransaction(async (tx) => {
  const user = await userService.createUser(data, tx);
  await creditService.initializeCreditWithFree(payload, tx);
  await subscriptionService.initializeSubscription(user.userId, tx);
  return user;
});
```

禁止在事务链中漏传 `tx`，否则会退回宿主全局 client，破坏事务一致性。

## Route 注意事项

Next route / module 在 build 阶段被加载是正常行为。需要遵守两条约束：

- 不要在 route 顶层执行数据库查询
- 不要在使用 core route 前漏掉宿主 Prisma 注册

允许：

```ts
import '@/server/prisma';
export { POST } from '@core/app/api/user/anonymous/init/route';
```

避免：

```ts
const user = await userService.findByUserId(...);
```

如果 route 需要在请求时测试 DB，应放在 handler / hook 内部，而不是模块顶层。

## 日志与实例排查

默认只输出 Prisma error，避免开发和构建日志过多。

开启调试：

```bash
PRISMA_DEBUG=true
```

开启后可用于观察：

- 宿主 Prisma client 是否已成功注册给 `backend-core`
- query listener 是否重复注册
- 同一进程内查询是否复用了同一个 Prisma 实例
- SQL 语句与耗时

## Supabase TLS 配置

宿主应用 Prisma 通常会通过 `SUPABASE_DB_CA_CERT` 提供默认 TLS 证书校验策略。业务侧 `DATABASE_URL` 如果显式携带 `sslmode`、`sslcert`、`sslkey`、`sslrootcert` 这类 SSL 参数，则按 `pg` 的解析结果生效；这是业务方自己的连接安全配置责任。

典型配置形态：

```ts
new PrismaPg({
  connectionString: databaseUrl,
  ssl: process.env.SUPABASE_DB_CA_CERT
    ? { ca: process.env.SUPABASE_DB_CA_CERT, rejectUnauthorized: true }
    : { rejectUnauthorized: false },
})
```

业务侧 DB URL 示例：

```txt
postgresql://.../postgres?schema=XXX&pgbouncer=true
```

默认行为约定：

- 未配置 `SUPABASE_DB_CA_CERT`：仍然使用 TLS 加密连接，但不校验证书链和服务端身份，并输出一次 warn
- 已配置 `SUPABASE_DB_CA_CERT`：使用 TLS 加密连接，并使用该 CA 校验证书链和服务端身份
- 如果 `DATABASE_URL` 显式携带 SSL 参数，`pg` 会以 URL 参数为准，可能覆盖默认策略

## 打包与发布约定

### backend-core

当前 `backend-core` 的构建链不再包含 `prisma generate`，只负责编译与发布业务代码：

```json
{
  "build": "rm -rf dist && rollup -c rollup.config.mjs",
  "build:prod": "rm -rf dist && rollup -c rollup.config.mjs",
  "type-check": "tsc --noEmit",
  "prepack": "pnpm build"
}
```

打包原则：

- 不再发布 `core-prisma` generated 产物
- 不再要求 `backend-core` 自己持有 Prisma runtime client
- 优先只发布 `dist/**` 与必要的源码说明文件
- 运行时所需 Prisma 能力由宿主应用提供

### Vercel function trace

构建后可通过 `.nft.json` 检查函数 trace。重点确认：

- 不应出现 `.prisma/client/libquery_engine-*`
- 不应出现大量 `query_engine_bg.*`
- 不应出现 MySQL / SQLite / SQL Server / CockroachDB 的 query compiler
- 应保留 PostgreSQL ESM compiler：

```txt
query_compiler_bg.postgresql.mjs
query_compiler_bg.postgresql.wasm-base64.mjs
```

结论：

- PostgreSQL compiler 不能排除
- 当前 Prisma 使用 `engineType = "client"`，不再依赖旧 Rust query engine
- 但仍需要 PostgreSQL query compiler 在运行期把 Prisma query 编译为 SQL

### npm tarball

`backend-core` 的 npm 包应尽量避免发布无用源码与内部构建产物。

推荐检查点：

- 是否只发布必要的 `dist/**`
- 是否误发布 generated Prisma 代码
- 是否误发布 `d.ts.map` 等低价值产物
- `exports` 与 Rollup `entries` 是否一一对应

验证命令：

```bash
NPM_CONFIG_CACHE=/tmp/npm-cache-backend-core npm pack --dry-run --json --ignore-scripts
```

## 执行计划

本次改造分两步进行。

### Step 1: 先改 `User` 主链路

目标：

- 验证“宿主持有 Prisma，core 持有契约与 service 语义”这条路径可落地
- 尽量小范围完成一次闭环

范围建议：

- 抽出 `CoreUser` 相关实体与 DTO
- 抽出 host Prisma 的最小契约与事务接口
- 将 `UserService` 改为依赖 host Prisma contract，而不是直接依赖 `backend-core` 自己生成的 Prisma types
- 优先打通匿名用户初始化主链路
- 优先处理 `packages/backend-core/src/app/api/user/anonymous/init/route.ts` 所需的最小依赖

这一阶段的验收标准：

- `build` 通过

这一阶段暂不要求：

- 全量业务测试
- 全量 route 验证
- 剩余表的统一改造

### Step 2: 扩展到剩余公共表与链路

在 `User` 路径稳定后，再覆盖剩余能力：

- `Credit`
- `Subscription`
- `Transaction`
- `CreditAuditLog`
- `UserBackup`
- `Apilog`
- aggregate services
- context services
- 仍依赖 Prisma generated types 的 route / service / helper

这一阶段的验收标准：

- `build` 再次通过

业务回归测试由最终统一进行，不在每个局部步骤中展开。

## 实施原则

### 1. 优先修正边界，不做无关重构

本次重点是把：

- schema 决定权
- Prisma generated client 所有权
- service 与 ORM 的边界

三者重新放回正确位置。

### 2. 避免一次性抽象过度

第一阶段只需要抽出能支撑 `User` 主链路的最小 host Prisma contract 与类型边界，不必一次把全部数据访问抽象做到最复杂形态。

### 3. 保持应用侧接入面尽量稳定

对于现有使用方，应优先保证：

- route 出口尽量不变
- service 方法名尽量不变
- 核心返回数据结构尽量不变

### 4. build 作为阶段验收，测试统一后置

按当前计划：

- 每阶段完成后只验证 `build`
- 最终由业务方统一做集成测试与回归测试

## Unsafe SQL Follow-up

当前代码中仍保留少量 `unsafe` 原生 SQL 调用，后续建议逐步收敛。

### 原则

- 统计类 SQL 优先下沉为数据库函数
- 应用层只负责调用数据库函数，并定义稳定返回类型
- 如果继续保留 raw SQL，必须保持参数化，避免拼接不可信输入

### 当前待处理点

- `packages/backend-core/src/services/aggregate/anonymous.aggregate.service.ts`
  `pg_advisory_xact_lock(...)`
  这是数据库锁操作，不属于统计逻辑；可以暂时保留，但应限制在极少数事务控制场景内。

- `packages/backend-core/src/services/database/credit.service.ts`
  `getLowBalanceUsers`
  当前使用 raw SQL 进行余额筛选，后续可评估改回普通 Prisma 查询，或下沉为数据库函数。

- `packages/backend-core/src/services/database/creditAuditLog.service.ts`
  `getDailyUsageTrend`
  这是典型聚合统计 SQL，优先建议下沉为数据库函数。

- `packages/backend-core/src/services/database/transaction.service.ts`
  `getDailyRevenue`
  这是典型聚合统计 SQL，优先建议下沉为数据库函数。

### 风险说明

将统计 SQL 下沉到数据库函数并不意味着数据库会“自动消除所有 SQL 注入风险”。

真正降低风险的前提是：

- SQL 固定定义在数据库函数中
- 调用方只通过参数传值
- 函数内部不再动态拼接不可信 SQL 片段

因此，后续迁移到数据库函数时，仍应遵守参数化和最小动态拼接原则。

## 最终目标

改造完成后，`backend-core` 的定位应明确为：

- 统一公共表业务语义的服务层
- 统一公共数据契约的定义层
- 统一事务与数据访问接口的边界层

而不是：

- 固定数据库 schema 的 Prisma 发布包
- 宿主数据库物理结构的唯一控制者
