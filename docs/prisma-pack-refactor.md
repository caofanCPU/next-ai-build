# Prisma Packaging Refactor

本文记录 `backend-core` 与应用侧 Prisma 的当前设计、迁移要点，以及全局实例、事务和打包体积相关约束。

## 业务应用快速升级清单

业务侧接入或升级时，重点对照下面这些文件改：

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `apps/<app>/prisma/schema.prisma` | 只保留应用自己的 model | core 的用户、积分、订阅、订单等 model 已由 `backend-core` 持有，不再复制到应用 schema。generator 使用 `prisma-client`、`engineType = "client"`、`output = "../src/generated/prisma"`。 |
| `apps/<app>/tsconfig.json` | 增加应用 Prisma alias | 推荐增加 `@app-prisma -> ./src/generated/prisma/client`，业务代码不要写 `../../generated/prisma`。 |
| `apps/<app>/package.json` | 保证 dev/build 前生成应用 Prisma | `dev`、`build`、`build:prod` 中保留 `prisma generate`。应用 generated Prisma 不提交。 |
| `.gitignore` | 忽略应用 Prisma generated | 使用 `apps/*/src/generated/prisma/`。不要忽略 `packages/backend-core/src/core-prisma/`。 |
| `apps/<app>/src/server/prisma.ts` | 创建应用自己的 Prisma Client | 只服务应用自己的 model。默认只打印 error；需要排查时用 `PRISMA_DEBUG=true`。不要把 app client 注册给 core。 |
| `apps/<app>/src/server/services/*` | 应用自己的 service 放这里 | app service 可以调用 `backend-core` service，也可以使用 `@app-prisma` 操作应用自己的表。 |
| `apps/<app>/src/app/api/**/route.ts` | 避免顶层 DB 查询 | route 顶层可以创建 handler，但不要顶层执行查询。测试查询放在 handler/hook 内部。 |
| `apps/<app>/next.config.ts` | 保留 Prisma tracing excludes | 排除旧 Prisma query engine，以及非 PostgreSQL 的 query compiler；必须保留 PostgreSQL query compiler，否则 Vercel 运行时会缺文件。 |
| 环境变量 | 可选开启 `PRISMA_DEBUG=true` | 开启后打印 core Prisma 实例 ID、query listener ID 和 SQL 耗时；稳定后不建议开启。 |

## 目标

`backend-core` 是可发布的服务端能力包，承载通用用户、积分、订阅、订单、审计日志等 core DB model 和 service。应用侧可以有自己的业务 model，但不再把 core model 复制到应用 schema。

本次调整的目标：

- `backend-core` 可以独立 `prisma generate`、`type-check`、`build`、发布。
- 应用侧 Prisma Client 只负责应用自己的 model。
- core DB service 使用 `backend-core` 自己的 Prisma Client。
- 应用侧 service 可以作为本地目录继续扩展自己的 DB/service 形态。
- Prisma 打包不再携带 Rust query engine 大包。

## 当前目录约定

`backend-core` 的 Prisma 产物：

```txt
packages/backend-core/prisma/schema.prisma
packages/backend-core/src/core-prisma/
```

`src/core-prisma` 是 `backend-core` 自己发布和类型检查使用的 generated Prisma Client，必须提交并随包发布。不要把它放在 `generated` 目录下，避免被通用 ignore 规则误伤。

应用侧 Prisma 产物：

```txt
apps/ddaas/prisma/schema.prisma
apps/ddaas/src/generated/prisma/
```

应用侧 generated Prisma Client 是构建时产物，已由 `.gitignore` 忽略：

```gitignore
apps/*/src/generated/prisma/
```

应用侧通过别名引用自己的 Prisma Client：

```ts
import { PrismaClient } from '@app-prisma';
```

## Generator 配置

core:

```prisma
generator client {
  provider   = "prisma-client"
  output     = "../src/core-prisma"
  engineType = "client"
}
```

app:

```prisma
generator client {
  provider   = "prisma-client"
  output     = "../src/generated/prisma"
  engineType = "client"
}
```

`engineType = "client"` 是 Prisma 6 的 Rust-free 方案。配合 `@prisma/adapter-pg` 后，Vercel/Next function trace 不再携带 `libquery_engine-*` 和大量 `query_engine_bg.*` 文件。

## backend-core Build 链

`backend-core` 的构建命令必须先生成 `src/core-prisma`：

```json
{
  "prisma:generate": "rm -rf src/core-prisma && prisma generate --schema prisma/schema.prisma",
  "build": "pnpm prisma:generate && rm -rf dist && rollup -c rollup.config.mjs",
  "build:prod": "pnpm prisma:generate && rm -rf dist && rollup -c rollup.config.mjs",
  "type-check": "pnpm prisma:generate && tsc --noEmit",
  "prepack": "pnpm build"
}
```

`turbo.json` 中 `backend-core` 的 outputs 包含：

```json
["dist/**", "src/core-prisma/**"]
```

注意不要并发执行同一个 package 的 `build` 和 `type-check`。二者都会先清理并生成 `src/core-prisma`，并发时其它任务可能短暂读到空目录。

## Prisma 实例设计

`backend-core` 拥有自己的 core Prisma Client。默认导出保持兼容，但必须是 lazy：

```ts
export const prisma = new Proxy({} as BackendCorePrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getBackendCorePrisma(), property, receiver);
  },
});
```

不要写成：

```ts
export const prisma = getBackendCorePrisma();
```

原因：Next build 的 page data collection 会加载 server route/module。如果顶层 import 就创建 PrismaClient，build 阶段会出现多个 Prisma 实例。lazy proxy 可以保证“import 不创建，实际查询才创建”。

`getBackendCorePrisma()` 负责全局复用：

```ts
if (!globalForPrisma.prisma) {
  configureBackendCorePrisma(createPrismaClient());
}
```

在同一个 Node.js 进程内，core 查询会复用同一个 global Prisma Client。Vercel/Next 多 worker、多 serverless 实例之间天然不是同一个进程，因此会有多个实例，这是预期行为。

## 事务保证

core CRUD service 大多保持如下签名：

```ts
method(..., tx?: Prisma.TransactionClient)
```

内部统一通过：

```ts
const client = checkAndFallbackWithNonTCClient(tx);
```

规则：

- 传入 `tx` 时，所有操作走同一个 transaction client。
- 未传 `tx` 时，fallback 到 core 全局 Prisma Client。
- aggregate service 通过 `runInTransaction()` 开启 core transaction。

因此 core 内部事务生效的前提是：事务链路中的所有 core service 调用都必须把同一个 `tx` 继续传下去。新增 service 时必须遵守这个规则。

示例：

```ts
return runInTransaction(async (tx) => {
  const user = await userService.createUser(data, tx);
  await creditService.initializeCreditWithFree(payload, tx);
  await subscriptionService.initializeSubscription(user.userId, tx);
  return user;
});
```

禁止在 transaction 内漏传 `tx`，否则该步骤会退回全局 client，破坏事务一致性。

## 应用侧 service 示例

应用侧可以保留自己的 Prisma Client 和 service 目录。例如 ddaaS：

```txt
apps/ddaas/src/server/prisma.ts
apps/ddaas/src/server/services/ddaas-test-query.service.ts
```

`apps/ddaas/prisma/schema.prisma` 当前只保留应用自己的示例 model：

```prisma
model DdaasTestQuerySample {
  id        BigInt    @id @default(autoincrement())
  sampleKey String    @unique @map("sample_key") @db.VarChar(255)
  note      String?   @db.Text
  createdAt DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)

  @@map("ddaas_test_query_sample")
  @@schema("nextai")
}
```

这个表不会实际创建，只用于说明应用侧 model/service 的放置方式。

测试 service 可以调用 core service：

```ts
const user = await ddaasTestQueryService.findCoreUserByUserId(TEST_USER_ID);
```

这说明应用 route 可以调用自己的 service，自己的 service 再调用 `backend-core` 的 DB service。

## 跨 core/app 事务的边界

当前设计下，core 和 app 是两套 Prisma Client：

```txt
backend-core -> src/core-prisma
app          -> src/generated/prisma
```

因此：

- core 表之间的事务由 `backend-core` 保证。
- app 表之间的事务由 app 自己的 Prisma Client 保证。
- core 表和 app 表之间不能天然共享一个 Prisma transaction client。

如果未来确实需要“同一事务同时操作 core 表和 app 表”，需要重新评估为“应用 schema 合并 core models 并生成唯一 Prisma Client”的模式，或者引入显式补偿/最终一致性方案。

## 日志与实例排查

默认只输出 Prisma error，避免开发和构建日志过多。

开启调试：

```bash
PRISMA_DEBUG=true
```

开启后 core Prisma 会打印：

```txt
Prisma Client Created | ID: core-prisma_...
Prisma Query Logger Registered | Listener ID: listener_... | Instance ID: core-prisma_...
Prisma Instance ID: core-prisma_... | Listener ID: listener_...
SELECT ...;
耗时: 11ms, SQL
```

用这些日志可以判断同一进程内查询是否复用了同一个 Prisma 实例。

## Supabase TLS 配置

`backend-core` 和应用侧 Prisma 会通过 `SUPABASE_DB_CA_CERT` 提供默认 TLS 证书校验策略。业务侧 `DATABASE_URL` 如果显式携带 `sslmode`、`sslcert`、`sslkey`、`sslrootcert` 这类 SSL 参数，则按 `pg` 的解析结果生效；这是业务方自己的连接安全配置责任。

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

- 未配置 `SUPABASE_DB_CA_CERT`：仍然使用 TLS 加密连接，但不校验证书链和服务端身份，并输出一次 warn。
- 已配置 `SUPABASE_DB_CA_CERT`：使用 TLS 加密连接，并使用该 CA 校验证书链和服务端身份。
- 如果 `DATABASE_URL` 显式携带 SSL 参数，`pg` 会以 URL 参数为准，可能覆盖上面的默认策略。例如 `sslmode=disable` 会关闭 TLS，这是业务方显式配置的结果。

`SUPABASE_DB_CA_CERT` 在 Vercel 中直接粘贴真实多行 PEM 内容，不需要手写 `\n`，代码也不做换行 normalize。

## Route 注意事项

Next route/module 被 build 阶段加载是正常行为。不要在 route 顶层执行数据库查询，也不要让 import 链触发 PrismaClient 创建。

允许：

```ts
export const POST = createOpenRouterRoute({ ... });
```

避免：

```ts
const user = await userService.findByUserId(...);
```

如果 route 需要在请求时测试 DB，可以放在 handler/hook 内部，例如 ddaaS 的 `/api/ai/generate` 当前通过固定 userId 打印测试查询日志。

## 打包验证

构建后可通过 `.nft.json` 检查函数 trace。重点确认：

- 不应出现 `.prisma/client/libquery_engine-*`
- 不应出现大量 `query_engine_bg.*`
- 应保留 `query_compiler_bg.postgresql.mjs`
- 应保留 `query_compiler_bg.postgresql.wasm-base64.mjs`
- 不应出现 MySQL/SQLite/SQL Server/CockroachDB 的 query compiler
- DB API function 保持个位数 MB 级别，而不是 80MB 级别

当前 Rust-free Prisma Client 需要 PostgreSQL query compiler。它不是构建期工具，而是运行期把 Prisma Client query 编译为 PostgreSQL SQL 的组件，不能从 Vercel function trace 中排除。

### 当前验证结果

验证命令：

```bash
pnpm --filter @windrun-huaiin/ddaas-website build
```

构建成功后统计 `apps/ddaas/.next/server/app/**/*.nft.json`，关键 API route 结果：

| Route | Trace size | Old query engine | PostgreSQL compiler | Other DB compiler |
| --- | ---: | ---: | ---: | ---: |
| `/api/ai/generate` | 7.67MB | 0 | 2 | 0 |
| `/api/user/anonymous/init` | 7.67MB | 0 | 2 | 0 |
| `/api/user/credit-overview` | 8.36MB | 0 | 2 | 0 |
| `/api/user/pricing-context` | 7.66MB | 0 | 2 | 0 |
| `/api/stripe/checkout` | 8.80MB | 0 | 2 | 0 |
| `/api/stripe/customer-portal` | 8.06MB | 0 | 2 | 0 |
| `/api/webhook/clerk/user` | 7.63MB | 0 | 2 | 0 |
| `/api/webhook/stripe` | 8.43MB | 0 | 2 | 0 |

对比改造前，DB API route 约为 `79-82MB`。改造后稳定在 `7-9MB`。这个体积包含 Rust-free Prisma 运行期必需的 PostgreSQL query compiler。

PostgreSQL compiler 具体两个文件：

```txt
query_compiler_bg.postgresql.mjs                 约 0.01MB
query_compiler_bg.postgresql.wasm-base64.mjs     约 2.48MB
```

当前 trace 中已确认：

```txt
mysql compiler:       count=0
sqlite compiler:      count=0
sqlserver compiler:   count=0
cockroach compiler:   count=0
queryEngine/libquery_engine: count=0
```

当前 trace 中已不再出现旧 query engine：

```txt
.prisma/client/libquery_engine-*
@prisma/client/runtime/query_engine_bg.*
```

曾经尝试排除所有 `query_compiler_*`，本地 build 不一定暴露问题，因为本地完整 `node_modules` 仍可兜底；但 Vercel serverless function 只携带 traced 文件，线上会报：

```txt
ERR_MODULE_NOT_FOUND: query_compiler_bg.postgresql.mjs
```

因此 tracing excludes 只能排除旧 query engine、其它数据库 compiler、以及 PostgreSQL compiler 的 CJS 版本；不能排除 PostgreSQL `.mjs` compiler。

结论：`@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.mjs` 出现在 API route trace 里是预期行为，不能排除。

当前 `apps/ddaas/next.config.ts` 的 `outputFileTracingExcludes` 会排除：

- 旧 Rust query engine：`query_engine_*`、`.prisma/client/libquery_engine-*`
- 非 PostgreSQL query compiler：MySQL、SQLite、SQL Server、CockroachDB
- PostgreSQL compiler 的 CJS 版本：`.js`

但不会排除 PostgreSQL compiler 的 ESM 版本：

```txt
query_compiler_bg.postgresql.mjs
query_compiler_bg.postgresql.wasm-base64.mjs
```

原因是当前 Prisma 6 使用：

```prisma
engineType = "client"
```

这是 Rust-free Prisma Client。它不再依赖旧的 Rust query engine，但访问 PostgreSQL 时仍需要 PostgreSQL query compiler 在运行期把 Prisma query 编译为 SQL。

之前尝试排除所有 `query_compiler_*` 后，Vercel 线上已经出现过运行时报错：

```txt
ERR_MODULE_NOT_FOUND: query_compiler_bg.postgresql.mjs
```

因此：

- trace 里还有 PostgreSQL `.mjs` compiler：正确
- 它约 2.5MiB：正常，是当前 Rust-free Prisma 的运行期成本
- 其它数据库 compiler 数量为 0：正确
- 旧 Rust query engine 数量为 0：正确

当前打包优化目标不是把 PostgreSQL compiler 也裁掉，而是确保只保留 PostgreSQL compiler，不带其它数据库 runtime 和旧 Rust engine。
