# apps/ddaas dependency cleanup

本文记录 `apps/ddaas/package.json` 的一次依赖清理，只处理 `ddaas` 自身声明的依赖，不改动其他 workspace package。

## 已删除 dependencies

- `@clerk/localizations`
- `@clerk/shared`
- `@clerk/themes`
- `@fingerprintjs/fingerprintjs`
- `@hookform/resolvers`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-slot`
- `@tailwindcss/typography`
- `@windrun-huaiin/contracts`
- `autoprefixer`
- `class-variance-authority`
- `date-fns`
- `katex`
- `mermaid`
- `react-medium-image-zoom`
- `remark`
- `remark-gfm`
- `remark-mdx`
- `stripe`
- `svix`
- `zod`

这些包在 `ddaas` 里没有直接 import、没有被当前脚本或配置直接使用，且能力已经由本仓库其他 workspace package 自己声明的 `dependencies` 提供，例如：

- `@windrun-huaiin/base-ui`
- `@windrun-huaiin/lib`
- `@windrun-huaiin/third-ui`
- `@windrun-huaiin/backend-core`
- `@windrun-huaiin/fumadocs-local-md`

## 已删除 devDependencies

- `@tailwindcss/cli`
- `@types/react-medium-image-zoom`
- `baseline-browser-mapping`
- `fast-glob`
- `remark-frontmatter`
- `ts-morph`
- `ts-node`
- `unist-util-visit`

这些包在 `ddaas` 当前源码、脚本、`postcss.config.mjs`、`next.config.ts` 中都没有直接使用，相关能力由 workspace 内部工具包或库包承担。

## 保留说明

以下依赖本次没有删除：

- `@clerk/nextjs`
- `next`
- `next-intl`
- `next-themes`
- `react`
- `react-dom`
- `tailwindcss`
- `postcss`
- `@tailwindcss/postcss`
- `clsx`
- `tailwind-merge`
- `lucide-react`
- `nprogress`
- `@types/mdx`
- `@prisma/adapter-pg`
- `@prisma/client`
- `prisma`

保留原因：

- 有直接源码引用。
- 或者当前配置文件直接使用。
- 或者是 workspace package 的 `peerDependencies`，由 app 侧负责提供。

## 后续建议

- `@prisma/adapter-pg` 和 `@prisma/client` 目前放在 `devDependencies`，但 `apps/ddaas/src/server/prisma.ts` 存在运行时直接引用；如果后续按生产语义继续收敛，建议评估是否迁移到 `dependencies`。
