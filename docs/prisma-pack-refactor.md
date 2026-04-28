# Prisma Packaging Refactor

本文档已废弃，原先基于“`backend-core` 自带 Prisma schema / generated client / core-prisma runtime”的设计不再成立。

当前生效的主文档为：

- [`docs/backend-core-host-prisma-refactor.md`](./backend-core-host-prisma-refactor.md)

## 迁移说明

旧文档中的以下设计已废弃：

- `backend-core` 自己生成并发布 `src/core-prisma`
- `backend-core` 自己持有固定 schema 的 Prisma Client
- `backend-core` build / type-check 前先执行 `prisma generate`
- 以 `core-prisma` 作为运行时与类型边界

## 仍然有效并已迁移到主文档的内容

以下内容已经整合进新的主文档：

- 宿主应用 Prisma 接入要点
- `engineType = "client"` 的宿主 generator 约定
- 事务传递与 `tx` 约束
- Route 顶层避免执行 DB 查询
- Supabase TLS 配置建议
- Vercel function trace 检查点
- npm tarball / exports / Rollup entry 对齐原则
- 统计类 raw SQL 的后续收敛策略

如果后续需要继续补充构建、发包、trace、TLS 相关经验，应统一追加到：

- [`docs/backend-core-host-prisma-refactor.md`](./backend-core-host-prisma-refactor.md)
