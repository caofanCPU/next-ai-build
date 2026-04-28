## Backend Core 集成脚本说明（dev-scripts 版本）

CLI 功能原先在 `@windrun-huaiin/backend-core` 包内，现统一由 `@windrun-huaiin/dev-scripts` 提供，命令前缀为 `dev-scripts backend-core ...`。

### 包含内容
- Prisma：backend-core 自持公共模型、迁移与 `prisma` 单例；宿主不再通过 CLI 同步 schema 或 migrations。
- Service：数据库层 user/credit/subscription/transaction/creditAuditLog/apilog/userBackup；Stripe/Clerk/匿名用户相关 Next.js handlers。
- CLI：`dev-scripts backend-core routes:list|routes:sync` 生成本地路由壳。
- Lib：money-price-config（读 env）、appConfig、stripe-config、auth-utils，对外可直接 import。

### 宿主如何使用（第三方直接集成）
1. 安装：`pnpm add @windrun-huaiin/backend-core`（脚本命令通过 dev-scripts 提供）
2. 生成路由壳：`pnpm dev-scripts backend-core routes:sync --app-dir src/app`  
   - 默认不覆盖已有文件，`--force` 可覆盖。生成示例：
   ```ts
   // app/api/stripe/checkout/route.ts
   export { POST } from '@windrun-huaiin/backend-core/app/api/stripe/checkout/route';
   ```
   - 想自定义时直接改写或删除壳文件即可。
3. 使用服务：`import { prisma, userService, creditService } from '@windrun-huaiin/backend-core';`
4. 使用工具/配置：`import { getPriceConfig, getCreditsFromPriceId, stripe, ApiAuthUtils } from '@windrun-huaiin/backend-core/lib';`
5. 升级：升级包 → 跑 `dev-scripts backend-core routes:sync` 同步新增路由壳；数据库模型和迁移由 backend-core 包自身维护。

### 环境变量
```conf
# 积分初始化变量
CREDITS_INIT_FREE_AMOUNT=1
CREDITS_INIT_FREE_REGISTER_AMOUNT=2
CREDITS_INIT_FREE_EXPIRED_DAYS=7
CREDITS_ONE_TIME_EXPIRED_DAYS=30

## Stripe配置
STRIPE_SECRET_KEY=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_PRO_MONTHLY_AMOUNT=
STRIPE_PRO_MONTHLY_CURRENCY=
STRIPE_PRO_MONTHLY_CREDITS=
STRIPE_PRO_YEARLY_PRICE_ID=
STRIPE_PRO_YEARLY_AMOUNT=
STRIPE_PRO_DISCOUNT_PERCENT=
STRIPE_PRO_YEARLY_CURRENCY=
STRIPE_PRO_YEARLY_CREDITS=

STRIPE_ULTRA_MONTHLY_PRICE_ID=
STRIPE_ULTRA_MONTHLY_AMOUNT=
STRIPE_ULTRA_MONTHLY_CURRENCY=
STRIPE_ULTRA_MONTHLY_CREDITS=
STRIPE_ULTRA_YEARLY_PRICE_ID=
STRIPE_ULTRA_YEARLY_AMOUNT=
STRIPE_ULTRA_DISCOUNT_PERCENT=
STRIPE_ULTRA_YEARLY_CURRENCY=
STRIPE_ULTRA_YEARLY_CREDITS=

```

### CLI routes:sync 做了什么
```mermaid
sequenceDiagram
  participant Dev as 开发者
  participant CLI as dev-scripts backend-core
  participant FS as 宿主文件系统

  Dev->>CLI: dev-scripts backend-core routes:sync
  CLI->>CLI: 读取内置路由映射
  CLI->>FS: 为每个路由创建 app/api/{path} 目录
  alt 目标文件存在且未 --force
    CLI-->>FS: 跳过写入
  else 覆盖或新建
    CLI->>FS: 写入壳文件<br/>单行 re-export 或固定 wrapper
  end
  CLI->>Dev: 输出 created/overwritten/skip 状态
```
