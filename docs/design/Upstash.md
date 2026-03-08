# Upstash 统一接入设计与使用说明

本项目为 monorepo，统一后端基础设施封装包位于 `packages/backend-core`。Upstash 作为基础设施能力，遵循“约定即配置 + 配置即开关”原则，统一通过配置入口与工具方法对外提供能力。

## 设计思路（核心原则）

1. **配置即开关**：缺少环境变量时，相关函数返回 `null`/`false`，仅打印英文 warn，不阻塞启动。
2. **惰性初始化 + 单例缓存**：客户端在首次使用时创建并缓存复用（单运行实例内）。
3. **产品解耦**：Redis 与 QStash 独立初始化，互不依赖。
4. **默认策略**：使用官方客户端默认配置，不额外注入复杂重试、超时策略。
5. **仅基础设施**：不注入业务逻辑（trace/header/签名包装/业务重试等）。
6. **环境变量优先**：所有配置都从 `process.env` 读取。
7. **失败可恢复**：初始化失败不会永久锁死，后续调用可以重试恢复。

## Config 入口（基础能力）

位置：`packages/backend-core/src/lib/upstash-config.ts`

统一提供四个入口：

- `withRedis(fn)`：确保 Redis 可用后执行回调，不可用时返回 `null`
- `withQstash(fn)`：确保 QStash 可用后执行回调，不可用时返回 `null`
- `getRedis()`：仅返回当前缓存 Redis（不触发初始化）
- `getQstash()`：仅返回当前缓存 QStash（不触发初始化）

推荐业务侧优先使用 `withRedis` / `withQstash`，避免直接感知初始化时序。

## 客户端初始化与单例控制（重点）

### 1) 单运行实例内单例

- 单例语义是**进程/实例级**（符合 Next.js + Vercel 运行模型），不是跨实例全局单例。
- 每个运行实例内部，Redis/QStash 各自维护一个缓存客户端实例。

### 2) 并发初始化控制（single-flight）

- Redis 与 QStash 分别维护 `initPromise`。
- 并发请求首次触发初始化时，共享同一个 `initPromise`，避免重复创建多个客户端。
- 初始化完成后清空 `initPromise`，后续请求直接复用缓存实例。

### 3) 初始化可用性校验

- Redis：`new Redis(...)` 后立即 `ping()`，成功才写入缓存。
- QStash：创建客户端后立即执行健康探测，成功才写入缓存。
- 初始化校验失败时：返回 `null` 并 `warn`，但不永久禁用，后续可重试。

## 容错与告警设计（重点）

### 1) 配置容错

- 缺失必需环境变量：`warn` + 返回 `null`/`false`。
- Redis URL 非法：`warn` + 返回 `null`。

### 2) 初始化容错

- 初始化异常：`warn` + 返回 `null`。
- 不采用“首次失败永久锁死”策略，避免短暂故障导致长期不可用。

### 3) 运行期故障恢复

- 后台健康检查失败时，会清空对应缓存客户端，让后续请求触发重新初始化。
- `@upstash/lock` 客户端与 Redis 实例绑定；Redis 实例变化或 lock 调用异常时会重建 lock 客户端。

## 健康检查机制（重点）

### 1) Redis 健康检查

- 初始化成功后开启后台定时检查（`ping`）。
- 默认间隔：10 分钟。
- 配置项：`UPSTASH_REDIS_HEALTHCHECK_INTERVAL_MINUTES`（单位：分钟）。

### 2) QStash 健康检查

- 初始化成功后开启后台定时检查（HTTP 探测）。
- 默认间隔：10 分钟。
- 配置项：`UPSTASH_QSTASH_HEALTHCHECK_INTERVAL_MINUTES`（单位：分钟）。
- 健康检查 URL 可配置：`UPSTASH_QSTASH_HEALTHCHECK_URL`。

### 3) 设计取舍

- 不在每次业务操作前执行 `ping`，避免每次调用多一次网络开销。
- 采用“初始化强校验 + 低频后台巡检 + 故障后重建”的方案，平衡稳定性与性能。

## Redis 工具能力（高频场景）

### 1 分布式锁（官方 Lock 包）

位置：`packages/backend-core/src/lib/upstash/redis-lock.ts`

- 支持获取/释放锁
- 支持 `withLock` 形式的安全执行
- 依赖：`@upstash/lock`

### 2 点赞（去重 + 双向索引）

位置：`packages/backend-core/src/lib/upstash/redis-like.ts`

- 点赞/取消点赞
- 判断是否点赞
- 获取某目标点赞数（基于 Set 去重）
- 获取用户点赞过的目标列表
- 数据结构：
  - `like:target:{targetId}` -> Set(userId)
  - `like:user:{userId}` -> Set(targetId)

### 3 收藏（去重 + 双向索引）

位置：`packages/backend-core/src/lib/upstash/redis-favorite.ts`

- 收藏/取消收藏
- 判断是否收藏
- 获取某目标收藏数
- 获取用户收藏过的目标列表
- 数据结构：
  - `favorite:target:{targetId}` -> Set(userId)
  - `favorite:user:{userId}` -> Set(targetId)

### 4 计数器（普通 / 去重）

位置：`packages/backend-core/src/lib/upstash/redis-counter.ts`

- 普通计数（浏览/转发等）
  - 自增/读取
- 去重计数（如 UV）
  - 基于 Set 去重统计

### 5 常见数据结构封装（String / Hash / List）

位置：`packages/backend-core/src/lib/upstash/redis-structures.ts`

**String**

- 读写字符串
- 支持 TTL
- 统一删除 key

**JSON 泛型**

- 业务传对象写入，内部 `JSON.stringify`
- 读取时 `JSON.parse` 并返回泛型类型

**Hash (Map)**

- 字段读写/删除/读取全部
- 字段级 JSON 读写（泛型）

**List**

- 左/右 push
- 左/右 pop
- range 与长度

## QStash 工具能力

位置：`packages/backend-core/src/lib/upstash/qstash.ts`

功能覆盖：

- 发布消息
- 延时消息
- 定时任务（schedule）
- 取消定时任务
- 签名验签（开发环境可跳过）

验签策略：

- `NODE_ENV=development` 且 `SKIP_UPSTASH_QSTASH_VERIFY=1|true` 时跳过验签
- 非开发环境必须验签，失败直接抛错

## 核心依赖（仅官方包）

- `@upstash/redis`
- `@upstash/qstash`
- `@upstash/lock`

## 环境变量清单

**Redis**

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_REDIS_HEALTHCHECK_INTERVAL_MINUTES`（可选，默认 10）

**QStash**

- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `SKIP_UPSTASH_QSTASH_VERIFY`（可选，仅开发环境生效）
- `UPSTASH_QSTASH_HEALTHCHECK_INTERVAL_MINUTES`（可选，默认 10）
- `UPSTASH_QSTASH_HEALTHCHECK_URL`（可选）
