# 依赖升级备忘

本文记录 workspace 依赖升级时需要额外关注的事项。目标不是替代 changelog，而是避免升级基础包时反复踩同一类坑。

## 基础流程

1. 先确认当前运行环境：

```bash
node -v
pnpm -v
pnpm config get overrides
```

2. 修改 `pnpm-workspace.yaml` 的 catalog 后，重新解析依赖：

```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

只执行 `pnpm install` 可能会继续复用旧 lockfile，传递依赖不会重新解析。

3. 逐层验证：

```bash
pnpm peers check
pnpm --filter @windrun-huaiin/fumadocs-local-md build
pnpm --filter @windrun-huaiin/base-ui type-check
pnpm --filter @windrun-huaiin/third-ui type-check
pnpm ddaas:build
```

## tsdown / unrun 问题

`tsdown@0.21.9` 的传递依赖范围会解析到 `unrun@0.2.38`。该版本发布包缺少 `dist/index.mjs`，会导致：

```txt
Error [ERR_MODULE_NOT_FOUND]: Cannot find module .../unrun/dist/index.mjs
```

当前处理方式是在 `pnpm-workspace.yaml` 顶层放 override：

```yaml
overrides:
  tsdown>unrun: 0.2.37
```

注意：override 放在根 `package.json` 的 `pnpm.overrides` 时，当前 pnpm 版本未必能被 `pnpm config get overrides` 读取。放在 `pnpm-workspace.yaml` 顶层更直接。

确认是否生效：

```bash
pnpm config get overrides
rg -n 'unrun@|unrun:' pnpm-lock.yaml
find node_modules/.pnpm -maxdepth 1 -name 'unrun@*'
```

期望结果是 `unrun@0.2.37`。

## Node 升级

后续升级 `tsdown` 时需要同步关注 Node 版本。`tsdown@0.22.0` 要求：

```txt
node ^22.18.0 || >=24.0.0
```

如果使用 `nvm`，升级示例：

```bash
nvm install 24
nvm use 24
nvm alias default 24
node -v
```

回退示例：

```bash
nvm use 22.14.0
nvm uninstall 24.15.0
nvm alias default 22.14.0
```

不要急着删除旧 Node。多项目并存时，保留旧版本更方便回退。

## TypeScript 升级

升级到 TypeScript 6 时要注意：

- `baseUrl` 会触发 TS5101 废弃提示。
- 可以临时加 `"ignoreDeprecations": "6.0"` 继续迁移。
- 长期应逐包移除 `baseUrl`，重新整理 `paths`。
- 某些依赖的 peer range 可能还停留在 TS 5，例如 `@upstash/lock`。

如果走激进升级路线，需要一起评估：

```txt
Node 24 LTS
tsdown 0.22.x
typescript 6.x
```

如果只是为了继续做业务功能，优先保持：

```txt
tsdown 0.21.9
typescript 5.x
tsdown>unrun 0.2.37
```

## Peer 依赖警告

有些 peer 警告是上游声明滞后，不一定代表实际不可用。例如：

- `tailwindcss-animate@1.0.7` 未声明 Tailwind 4。
- `@upstash/lock@0.2.1` 未声明 TypeScript 6。

处理原则：

1. 先查上游是否已有新版。
2. 如果没有新版，再考虑 `packageExtensions` 补正 peer range。
3. 不要为了消除 peer warning 盲目升级整条工具链。

## 本次结论

当前为了继续推进 BeamFrame 任务，先采用稳定方案：

```txt
TypeScript 5.x
tsdown 0.21.9
pnpm override: tsdown>unrun 0.2.37
```

Node / TypeScript / tsdown 的整体升级后续单独处理，不和动画组件任务混在一起。
