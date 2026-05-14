# create-diaomao-app 使用说明

`create-diaomao-app` 用于从 npm 上发布的 `@windrun-huaiin/diaomao` 模板包创建一个新的 diaomao 单工程应用。

## 如何使用

在一个空目录或普通工作目录中执行：

```bash
npx @windrun-huaiin/dev-scripts create-diaomao-app my-app
```

创建时指定数据库 schema：

```bash
npx @windrun-huaiin/dev-scripts create-diaomao-app my-app --schema my_schema
```

也可以使用短参数：

```bash
npx @windrun-huaiin/dev-scripts create-diaomao-app my-app -s my_schema
```

参数说明：

- `my-app`：要创建的项目目录名。
- `--schema <name>`：数据库 schema 名。可选，不传时默认使用项目目录名。

示例：

```bash
npx @windrun-huaiin/dev-scripts create-diaomao-app demo-ai --schema demo_ai
```

创建完成后进入项目：

```bash
cd demo-ai
pnpm build
pnpm dev
```

首次启动前需要检查生成的 `.env.local`，把数据库、鉴权、支付等运行时环境变量改成自己的配置。

## 执行目录要求

脚本会检查执行命令时所在目录，而不是检查即将生成的项目目录。

如果当前目录同时存在：

```text
package.json
pnpm-workspace.yaml
```

脚本会认为你在 monorepo 根目录中执行，并直接退出：

```text
Detected monorepo environment, NextJS DO NOT SUPPORT MONOREPO WELL!
```

如果当前目录存在 `package.json`，但不存在 `pnpm-workspace.yaml`，脚本会认为你在已有项目中执行，也会退出，避免创建嵌套项目。

推荐做法是在桌面、临时目录、业务项目父目录等没有 `package.json` 的目录执行创建命令。

## pnpm 版本和安装

生成项目会写入固定包管理器版本：

```json
"packageManager": "pnpm@11.1.2"
```

安装依赖时脚本优先执行：

```bash
corepack pnpm install
```

这会让 Corepack 根据生成项目 `package.json` 里的 `packageManager` 使用 `pnpm@11.1.2`。

如果 Corepack 不可用或执行失败，脚本会回退到：

```bash
pnpm install
```

脚本不会使用 `npm install`。如果两种 pnpm 安装方式都失败，需要进入生成项目后手动执行：

```bash
pnpm install
```

模板工程是单工程项目，不是 monorepo 子包。模板发布时应把依赖版本写入生成项目自己的 `package.json`，而不是依赖当前仓库根部的 workspace catalog。模板可以携带 `pnpm-workspace.yaml` 来承载 pnpm 11 需要的安装行为配置。

## 脚本主要实现过程

脚本入口：

```bash
npx @windrun-huaiin/dev-scripts create-diaomao-app <project-name> [--schema <name>]
```

内部主要步骤如下。

1. 计算 schema 名

如果传了 `--schema`，使用传入值；否则使用项目目录名：

```ts
const schemaName = options.schema || path.basename(targetDir);
```

2. 检查当前执行目录

脚本检查当前目录是否已有 `package.json` 和 `pnpm-workspace.yaml`，用于避免在 monorepo 或已有项目中误创建嵌套工程。

3. 下载模板包

脚本会在临时目录中执行：

```bash
npm pack @windrun-huaiin/diaomao
```

然后解压 tarball，并把解压出的 `package/` 内容复制到目标项目目录。

4. 处理环境变量文件

如果模板中存在：

```text
.env.local.txt
```

会重命名为：

```text
.env.local
```

5. 替换 Prisma schema

如果存在：

```text
prisma/schema.prisma
```

会把模板中的 schema 配置替换为目标 schema。

替换规则包括：

```prisma
schemas  = ["diaomao", "public"]
```

以及所有：

```prisma
@@schema("diaomao")
```

6. 替换数据库初始化 SQL

脚本会尝试处理：

```text
database/init-schema.sql
database/create.sql
```

模板默认 schema 固定为：

```text
diaomao
```

模板默认业务角色固定为：

```text
diaomao_app
```

替换规则：

- `diaomao_app` 替换成 `${schemaName}_app`
- `diaomao` 替换成 `schemaName`

这会覆盖 `CREATE SCHEMA`、`GRANT`、`REVOKE`、`ALTER DEFAULT PRIVILEGES`、`schema.table` 建表语句等常见位置。

如果 SQL 文件不存在，脚本会跳过，不会中断创建流程。

7. 处理 changeset 模板

如果存在 `.changeset` 目录，会写入：

```text
.changeset/d8-template.mdx
```

8. 修改生成项目 package.json

脚本会更新：

```json
{
  "name": "项目目录名",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@11.1.2"
}
```

同时确保 `devDependencies.dotenv` 存在，并移除发布模板包相关字段：

- `publishConfig`
- `files`

脚本还会删除 `djvp` script。其他同步数据库的命令不会被额外处理。

9. 安装依赖

优先：

```bash
corepack pnpm install
```

回退：

```bash
pnpm install
```

10. 初始化 Git

脚本会尝试执行：

```bash
git init
git add .
git commit -m "feat: initial commit from diaomao template"
```

如果 Git 初始化失败，只打印警告，不影响项目文件生成。

## 日志答疑

### `prisma/schema.prisma not found in template, skipping schema replacement`

模板包里没有 `prisma/schema.prisma`。

这是允许的。脚本会跳过 Prisma schema 替换，继续创建项目。

### `database/init-schema.sql not found in template, skipping schema replacement`

模板包里没有对应 SQL 文件。

这是允许的。脚本只会处理存在的 `database/init-schema.sql` 和 `database/create.sql`。

### `Updated database/create.sql with schema: demo_ai`

说明 SQL 文件中的模板 schema `diaomao` 已被替换成 `demo_ai`。

常见变化包括：

```sql
CREATE TABLE IF NOT EXISTS diaomao.users
```

变成：

```sql
CREATE TABLE IF NOT EXISTS demo_ai.users
```

### `corepack pnpm failed, trying pnpm...`

说明 Corepack 没有成功拉起 `pnpm@11.1.2`。

脚本会继续尝试使用当前环境 PATH 里的 `pnpm install`。

如果希望严格使用项目指定版本，可以先检查本机 Corepack：

```bash
corepack --version
corepack enable
```

### `Failed to install dependencies. Please run pnpm install manually.`

说明 `corepack pnpm install` 和 `pnpm install` 都失败了。

进入生成项目后手动执行：

```bash
pnpm install
```

如果仍失败，优先检查：

- Node.js 版本
- Corepack 是否启用
- pnpm 是否安装
- 网络是否能访问 npm registry
- 生成项目中的 `pnpm-workspace.yaml` 是否存在

### `The modules directory at ".../node_modules" will be removed and reinstalled from scratch. Proceed?`

可能看到类似提示：

```text
✔ The modules directory at "<project-path>/node_modules" will be removed and reinstalled from scratch. Proceed? (Y/n) · true
```

这是 pnpm 发现当前项目的 `node_modules` 需要按当前安装配置重新生成。常见原因包括：

- 之前用不同 pnpm 版本安装过依赖。
- 之前用不同包管理器安装过依赖。
- `packageManager`、`pnpm-workspace.yaml` 或 lockfile 发生了变化。
- 目标目录不是全新目录，里面已经存在旧的 `node_modules`。

如果确认当前目录就是要创建或修复的项目目录，可以选择 `Y` 继续。pnpm 会删除旧 `node_modules` 并重新安装。

### `Ignored build scripts ... Run "pnpm approve-builds" ...`

这是 pnpm 对依赖构建脚本的安全提示。Prisma、sharp、swc 等包可能需要构建或下载二进制。

模板项目应携带正确的 `pnpm-workspace.yaml`，把需要允许构建的依赖配置好。若仍看到该提示，说明当前使用的 pnpm 版本或配置读取结果与预期不一致，优先确认安装日志里显示的 pnpm 版本。

### `Detected monorepo environment, NextJS DO NOT SUPPORT MONOREPO WELL!`

说明你是在一个同时包含 `package.json` 和 `pnpm-workspace.yaml` 的目录中执行命令。

当前脚本不支持在 monorepo 根目录中创建新应用。请切换到没有 `package.json` 的父目录后再执行。

### `Warning: You are in a directory that already contains package.json`

说明你在已有项目目录中执行了创建命令。

脚本会退出，避免创建嵌套项目。请切换到项目父目录或空目录后重试。
