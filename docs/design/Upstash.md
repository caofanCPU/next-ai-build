# Upstash 统一接入设计与使用说明

本项目为 monorepo，统一后端基础设施封装包位于 `packages/backend-core`。Upstash 作为基础设施能力，遵循“约定即配置 + 配置即开关”的原则，统一通过配置与工具方法对外提供能力。

## 设计思路（核心原则）

1. **配置即开关**：缺少环境变量时，相关函数返回 `null`/`false`，仅打印英文 warn，不阻塞启动。
2. **惰性初始化 + 单例缓存**：客户端第一次使用时创建并缓存复用。
3. **产品解耦**：Redis 与 QStash 独立初始化，互不依赖。
4. **默认策略**：使用官方客户端默认配置，不添加额外重试、超时等策略。
5. **仅基础设施**：不注入业务逻辑（如 trace/header/签名包装/重试封装等）。
6. **环境变量优先**：所有配置从 `process.env` 读取。

## Config 入口（基础能力）

位置：`packages/backend-core/src/lib/upstash-config.ts`

提供两个统一入口：
- `getRedis()`：返回 Redis 实例或 `null`
- `getQstash()`：返回 QStash Client 实例或 `null`

缺失环境变量时只 warn 并返回 `null`，业务需自行判断是否降级。

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

**QStash**
- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `SKIP_UPSTASH_QSTASH_VERIFY`（可选，仅开发环境生效）
