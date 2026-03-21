# Prisma 7 升级说明

本文档面向当前仓库 `/Users/funeye/IdeaProjects/next-ai-build`，说明如何将 Prisma 从 `6.x` 升级到 `7.x`。

本文档只覆盖以下内容：

- 依赖升级
- `schema.prisma` 调整
- Prisma Client 生成方式调整
- PostgreSQL + Supabase + Vercel Serverless 运行时适配
- 当前项目中的 Prisma 工具类兼容性说明

本文档不覆盖以下内容：

- `prisma migrate` 的线上执行
- 自动变更线上数据库结构
- 数据迁移脚本编写

因为当前项目线上数据库是手动维护，所以升级目标是：

- 保持 Prisma Client 可正常生成
- 保持应用运行时查询和事务可正常使用
- 尽量减少对现有业务代码的侵入

## 1. 当前项目现状

仓库当前是 `pnpm` monorepo，并且有两个 Prisma schema：

- `apps/ddaas/prisma/schema.prisma`
- `packages/backend-core/prisma/schema.prisma`

当前 catalog 版本定义在 `pnpm-workspace.yaml`：

- `@prisma/client: ^6.17.1`
- `prisma: ^6.17.1`

当前代码中存在直接从 `@prisma/client` 导入 Prisma Client 的写法，例如：

- `packages/backend-core/src/prisma/prisma.ts`
- `packages/backend-core/src/prisma/client.ts`
- `packages/backend-core/src/prisma/index.ts`
- `packages/backend-core/src/services/database/prisma-model-type.ts`

当前 Node 版本为 `v22.14.0`，满足 Prisma 7 的要求。

## 2. Prisma 7 对本项目的主要影响

从 Prisma 6 升级到 Prisma 7，对当前仓库最关键的变化如下：

1. `generator client` 需要改为新的生成器写法。
2. Prisma Client 需要显式指定 `output`。
3. 不应继续把运行时 client 完全依赖为 `@prisma/client` 默认导出位置。
4. PostgreSQL 在 Prisma 7 下建议明确使用 driver adapter。
5. Prisma CLI 不再默认自动加载 `.env`，需要显式处理。

对本项目来说，真正需要关注的是运行时是否稳定，而不是迁移命令。

## 3. 升级目标版本

建议统一升级到同一小版本，避免 monorepo 中出现 Prisma 内部版本不一致。

建议版本：

- `prisma: ^7.5.0`
- `@prisma/client: ^7.5.0`
- `@prisma/adapter-pg: ^7.5.0`
- `pg: ^8.16.3`
- `dotenv: ^16.4.7`

## 4. 依赖调整

先修改根目录 `pnpm-workspace.yaml` 中的 `catalog`：

```yaml
catalog:
  "@prisma/client": ^7.5.0
  "prisma": ^7.5.0
  "@prisma/adapter-pg": ^7.5.0
  "pg": ^8.16.3
  "dotenv": ^16.4.7
```

然后确保使用 Prisma 的包通过 `catalog:` 引入这些依赖。

建议至少调整：

- `packages/backend-core/package.json`
- `apps/ddaas/package.json`

如果某个包只消费别处封装好的 Prisma 能力，而不直接执行 `prisma generate` 或不直接创建 Prisma Client，可以按实际情况减少依赖。

## 5. schema.prisma 调整

当前两个 schema 都还在使用旧写法：

```prisma
generator client {
  provider = "prisma-client-js"
}
```

升级到 Prisma 7 后，建议改成新写法，并显式指定输出目录。

### 5.1 apps/ddaas 的 schema

文件：

- `apps/ddaas/prisma/schema.prisma`

建议改为：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### 5.2 backend-core 的 schema

文件：

- `packages/backend-core/prisma/schema.prisma`

建议改为：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

说明：

- `output` 路径是相对 `schema.prisma` 所在目录的。
- 上面这个路径会把生成结果放到各自包的 `src/generated/prisma`。
- 后续业务代码需要从这个生成目录导入，而不是继续假设所有运行时类型都从 `@prisma/client` 自动提供。

## 6. 运行时代码调整

### 6.1 导入路径调整

当前代码大量使用：

```ts
import { PrismaClient, Prisma } from '@prisma/client';
```

升级后，应改为从生成目录导入。例如在 `packages/backend-core` 中：

```ts
import { PrismaClient, Prisma } from '../generated/prisma/client';
```

具体路径以最终 `output` 为准。

### 6.2 PostgreSQL adapter 调整

当前数据库是 PostgreSQL，因此 Prisma 7 建议在运行时显式使用 `@prisma/adapter-pg`。

示例：

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 300_000,
});

const prisma = new PrismaClient({
  adapter,
});
```

说明：

- `DATABASE_URL` 仍然是主运行时连接串。
- 显式设置超时参数更稳妥，避免升级后因为底层 `pg` 默认行为差异导致线上等待异常。

## 7. Supabase + Vercel Serverless 适配建议

当前部署环境是：

- 后端运行在 Vercel Serverless
- 数据库使用 Supabase PostgreSQL

这种场景下，更建议应用运行时使用 Supabase 提供的 `transaction mode` 连接。

### 7.1 为什么优先 transaction mode

原因很直接：

- Serverless 实例短生命周期、并发波动大
- `transaction mode` 更适合作为外部连接池
- Prisma 运行时查询和事务都更适合走这种 pooled connection

### 7.2 连接串建议

运行时建议：

- 使用 Supabase 的 `transaction mode` 连接串
- 在连接串上加 `?pgbouncer=true`

示意：

```env
DATABASE_URL="postgres://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
```

说明：

- `6543` 只是常见 pooler 端口示意，具体以 Supabase 控制台提供的连接串为准。
- `?pgbouncer=true` 是重点，用于避免 prepared statements 与 pooler 模式冲突。

### 7.3 本项目对 session mode 的态度

本项目运行时不需要优先使用 Supabase `session mode`。

如果只关心应用运行和事务：

- `transaction mode` 即可

本文档不讨论 `prisma migrate`，因此也不要求为迁移单独维护 direct connection 方案。

## 8. Prisma 事务能力是否还能正常使用

可以。

Prisma 7 配合 `PrismaPg` 时，事务能力仍然保留，主要包括：

- `prisma.$transaction([...])`
- `prisma.$transaction(async (tx) => { ... })`

这意味着当前项目里的事务封装思路可以保留。

对于当前部署模型，推荐继续使用：

- `prisma.$transaction(async (tx) => { ... })`

这是因为它最接近当前已有封装，也更适合封装日志、错误打印和回滚观测。

## 9. 现有工具类兼容性判断

### 9.1 `packages/backend-core/src/prisma/prisma.ts`

当前职责：

- 创建 Prisma 全局单例
- 注册 SQL query 日志监听
- 格式化输出 SQL
- 提供事务客户端降级工具

升级到 Prisma 7 后：

- 整体设计仍可保留
- 需要调整 import 路径
- 需要在 `new PrismaClient()` 时注入 `adapter`
- query 日志监听大概率仍可继续使用
- `event.params` 格式建议在升级后手工跑几条 SQL 验证一下

结论：

- 这是“可保留、需微调”的文件
- 不是需要推倒重写的文件

### 9.2 `packages/backend-core/src/prisma/prisma-transaction-util.ts`

当前职责：

- 对 `prisma.$transaction` 做一层封装
- 事务异常时打印回滚日志

升级到 Prisma 7 后：

- 事务 API 仍可继续使用
- 回滚行为仍由 Prisma 保证
- 需要调整的主要是类型导入路径

结论：

- 这个文件也属于“可保留、需微调”

## 10. 推荐的升级步骤

建议按以下顺序操作。

### 第一步：修改依赖版本

修改：

- `pnpm-workspace.yaml`
- 各相关 package 的 `package.json`

补齐或升级：

- `prisma`
- `@prisma/client`
- `@prisma/adapter-pg`
- `pg`
- `dotenv`

### 第二步：修改两个 schema 的 generator

修改：

- `apps/ddaas/prisma/schema.prisma`
- `packages/backend-core/prisma/schema.prisma`

统一切到：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### 第三步：显式处理 env 加载

建议在会执行 Prisma CLI 的包内增加 `prisma.config.ts`。

示例：

```ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
```

适用包：

- `apps/ddaas`
- `packages/backend-core`

是否两个都加，取决于是否都要独立执行 `prisma generate`。

### 第四步：生成 Prisma Client

执行：

```bash
pnpm install
pnpm --filter @windrun-huaiin/backend-core exec prisma generate
pnpm --filter @windrun-huaiin/ddaas-website exec prisma generate
```

### 第五步：修改运行时代码导入

重点文件：

- `packages/backend-core/src/prisma/prisma.ts`
- `packages/backend-core/src/prisma/client.ts`
- `packages/backend-core/src/prisma/index.ts`
- `packages/backend-core/src/services/database/prisma-model-type.ts`
- `packages/backend-core/src/prisma/prisma-transaction-util.ts`

处理原则：

- 从生成目录导入 Prisma 类型和 Prisma Client
- 在 `PrismaClient` 初始化时注入 `PrismaPg`
- 保留现有日志与事务封装逻辑

### 第六步：验证运行时

至少验证以下内容：

1. 应用启动后 Prisma Client 能正常初始化
2. 普通查询可正常执行
3. `runInTransaction` 内多条写操作可以成功提交
4. 人为抛错时事务可以回滚
5. SQL 日志仍能正常打印

## 11. 最小改动原则

本项目升级到 Prisma 7 的核心策略不是“全面重构”，而是：

- 先迁移生成方式
- 再迁移 import 路径
- 再接入 `PrismaPg`
- 保留现有封装层

也就是说，当前已有的：

- SQL 打印工具
- 事务工具
- 全局单例模式

都可以继续沿用，只需要围绕 Prisma 7 的新生成模式和 adapter 模式做兼容调整。

## 12. 结论

对当前仓库来说，Prisma 7 升级是可做的，而且不需要推翻现有 Prisma 封装。

升级后的现实目标应该是：

- 继续在 Vercel Serverless 上运行
- 继续连接 Supabase PostgreSQL
- 运行时优先使用 Supabase `transaction mode`
- 保留现有事务封装和 SQL 日志能力
- 不把数据库结构变更流程耦合进这次升级

从工程角度看，这次升级的主要工作量集中在：

- 依赖升级
- schema generator 调整
- Prisma Client 导入路径调整
- `PrismaPg` 接入

而不是业务查询逻辑重写。

## 13. 多项目使用模式的现实问题

当前项目在 Prisma 6 下的使用模式是：

- `backend-core` 作为底层通用能力包发布
- `backend-core` 提供通用数据表相关的 service 方法与工具
- `ddaas` 或其他上层应用自己维护完整 schema
- 上层应用通过脚本把基础表同步进自己的 schema
- Prisma Client 的生成发生在 `ddaas` 这类应用项目内

这套模式在 Prisma 6 下能较顺地工作，一个重要原因是 Prisma 6 的默认使用方式更“隐式”：

- Client 默认生成到 `node_modules`
- 下层包更容易直接依赖 `@prisma/client`
- 多个包更容易假设“自己看到的是同一个 Prisma Client 世界”

到了 Prisma 7，这个前提不再成立。

### 13.1 Prisma 7 下无法继续依赖“隐式共享 client”

Prisma 7 明确要求：

- 使用 `prisma-client` generator
- 显式指定 `output`
- 从生成目录导入 Prisma Client

这意味着：

- `backend-core` 无法天然知道消费方把 client 生成到了哪里
- `backend-core` 也不能再默认依赖消费方的 `@prisma/client` 产物

结论：

- Prisma 6 下那种“应用层生成，底层包隐式复用”的实现方式，在 Prisma 7 下不能原样照搬

### 13.2 如果 backend-core 自己生成 client，会发生什么

如果 `backend-core` 自己也生成一份 Prisma Client，那么它作为 npm 包发布时，通常需要把生成产物一起发布出去。

这本身不是大问题，尤其当前基础表数量不大，生成物体积通常可接受。

但更重要的影响是：

- `backend-core` 的 generated client
- `ddaas` 的 generated client

它们会成为两套不同的 Prisma Client。

需要注意：

- 它们可以连接同一个数据库
- 但它们不是同一个事务上下文
- 它们的 `PrismaClient` / `TransactionClient` 类型也不应默认认为完全可互换

### 13.3 为什么事务是核心冲突点

当前项目需要支持这样的业务场景：

- `ddaas` 先写自己的业务表
- 再调用 `backend-core` 的 service 写基础表
- 两者在同一个事务里统一提交或回滚

这在 Prisma 7 下并不是做不到，但有一个硬前提：

- 所有事务内操作必须走同一个 client 开启出来的那个 `tx`

如果出现下面这种情况：

- `ddaas` 用自己的 Prisma Client 开启事务
- `backend-core` 的 service 内部却切回了 `backend-core` 自己的全局单例 client

那么：

- `backend-core` 的操作就不在 `ddaas` 的事务里
- 事务原子性会被破坏

所以真正的问题不是“能不能跨项目组合处理数据”，而是：

- 不能依赖两套独立 Prisma Client 自动共享同一个事务

### 13.4 Prisma 7 下可行的工程做法

如果希望继续维持“数据库 schema 在应用项目里，backend-core 主要提供 service 能力”的模式，那么最现实的约束是：

- `backend-core` 的 service 必须支持传入外部 `tx` 或 `db`
- 事务场景下，`backend-core` 必须优先使用调用方传入的同一个事务上下文
- 不能在事务内部偷偷回退到 `backend-core` 自己的全局单例 Prisma Client

也就是说：

- 非事务场景：可以使用默认全局单例
- 跨模块事务场景：必须显式透传同一个 `tx`

### 13.5 这是否代表 Prisma 7 无法支持跨模块组合

不是。

Prisma 7 仍然可以支持：

- 多模块共同操作同一个数据库
- 多模块参与同一个事务
- 上层应用调用底层 service 完成组合业务

但实现方式必须从“隐式共享 client”改成“显式传递事务上下文”。

### 13.6 这对当前仓库意味着什么

对当前仓库来说，有两条现实路线：

第一条路线：

- `backend-core` 自己也生成 Prisma Client
- 发布时带上 generated client
- `backend-core` 继续导出自己的通用 model type、service 和工具
- 事务场景下，上层应用需要把同一个 `tx` 显式传给 `backend-core`

第二条路线：

- `backend-core` 不发布 generated client
- 上层应用统一 generate
- `backend-core` 改造成更抽象的 service/repository 层，不再直接绑定 Prisma 原生类型

从改造成本看：

- 第一条路线改动更小
- 第二条路线工程边界更纯，但重构量明显更大

## 14. Prisma 6 升级到 7，是否有明显收益

这部分需要非常务实地看。

如果项目只是把 Prisma 当作 ORM / SQL 构建工具，而当前 Prisma 6 已经稳定可用，那么 Prisma 7 不一定是“必须立即升级”的版本。

### 14.1 Prisma 7 的主要收益

Prisma 官方给出的 Prisma 7 方向，核心是新的 Rust-free client 架构：

- 更小的生成产物
- 不再需要 Rust engine 二进制
- 在 serverless / edge / 打包场景下更轻量
- 部署更简单，跨环境兼容性更好

官方文档中明确提到，新 `prisma-client` + Rust-free 架构会带来：

- 更小的 bundle size
- 更少的系统资源占用
- 更轻量的部署体验

这些收益对以下场景更有价值：

- Vercel Serverless
- 较强调包体积和冷启动的环境
- 频繁打包发布的 monorepo
- 对 Rust engine 二进制分发较敏感的 CI/CD 流程

### 14.2 Prisma 7 最大的代价

Prisma 7 的主要代价也很明显：

- `output` 必须显式配置
- import 路径要改
- PostgreSQL 需要 driver adapter
- `.env` 加载方式要显式处理
- 像当前仓库这种多项目/底层 service 包模式，边界会比 Prisma 6 更严格

所以如果当前 Prisma 6 已经很稳定，升级成本并不是零。

### 14.3 Prisma 6 在并发下是否明显更差

就 Prisma 官方文档来看，没有看到一个可以直接下结论的说法：

- “Prisma 6 在高并发下性能很差”
- 或者 “升级到 Prisma 7 会显著提升普通 CRUD 并发性能”

我没有找到 Prisma 官方把 Prisma 7 的核心卖点定义为：

- 单纯查询吞吐显著提升
- 普通 CRUD 并发大幅优于 Prisma 6

更准确地说，Prisma 7 的优势更偏向于：

- client 架构更现代
- serverless/edge 部署更轻
- 避免 Rust binary 带来的构建和运行时包袱

也就是说，如果你的判断标准是：

- 日常 ORM 查询够不够用
- 是否能少写 CRUD
- 事务是否稳定

那么 Prisma 6 在这类用途上并没有官方证据表明“已经明显不行”。

### 14.4 对当前项目的现实判断

结合当前仓库特点：

- 主要诉求是 ORM / SQL 能力
- 不依赖 Prisma 的新潮能力
- 有多项目共用 service 的特殊架构
- 已经有自己的通用表同步方案

所以这次升级并不是一个“必须立刻做”的高优先级事项。

更现实的判断是：

- 如果你当前 Prisma 6 运行稳定，且发布构建没有明显被 Rust engine 拖累
- 如果 serverless 部署体积、冷启动、二进制兼容性没有成为实际痛点

那么留在 Prisma 6 一段时间，是合理的。

### 14.5 什么情况下更值得升到 7

更适合升级到 Prisma 7 的情况包括：

- 你想统一切到 Rust-free client
- 你在 Vercel/Serverless 环境里被包体积或构建产物困扰
- 你未来准备把 Prisma 的工程边界重新梳理清楚
- 你愿意接受一次围绕 client 输出和事务上下文传递的结构调整

### 14.6 当前建议

对当前项目，建议不要把“升级到 Prisma 7”理解为纯收益升级。

更准确的判断是：

- 它有部署和运行时架构上的收益
- 但不一定会直接带来你最关心的业务 CRUD 性能跃迁
- 对当前多项目 Prisma 使用模式，它反而会暴露边界问题

因此，如果当前 Prisma 6 已稳定支撑业务，且没有遇到明显的打包、部署、二进制兼容问题，那么继续停留在 Prisma 6，是完全合理的工程选择。
