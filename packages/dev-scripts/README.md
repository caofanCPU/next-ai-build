# @packages/dev-scripts

一个用于多语言项目的开发脚本工具集，支持翻译检查、翻译清理、博客索引生成等功能。

## 功能特性

- ✅ **翻译检查**: 检查翻译文件的完整性和一致性
- 🧹 **翻译清理**: 自动清理未使用的翻译键
- 📝 **博客索引生成**: 自动生成博客索引和月度统计
- 🧭 **Backend Core 集成**: 生成 Next.js 路由壳、合并 Prisma 模型、同步SQL
- ⚙️ **配置驱动**: 支持多种配置方式，适配不同项目结构
- 🔧 **CLI工具**: 统一的命令行接口，易于集成到构建流程

## 安装

```bash
# 在 monorepo 中使用
pnpm add -D @packages/dev-scripts

# 或在独立项目中使用
npm install -D @packages/dev-scripts
```

## 快速开始

### 1. 配置 package.json

在项目的 `package.json` 中添加配置：

```json
{
  "scripts": {
    "check-translations": "dev-scripts check-translations",
    "clean-translations": "dev-scripts clean-translations",
    "generate-blog-index": "dev-scripts generate-blog-index"
  },
  "devScripts": {
    "locales": ["en", "zh"],
    "defaultLocale": "en",
    "messageRoot": "messages",
    "scan": {
      "include": ["src/**/*.{tsx,ts,jsx,js}"],
      "includeWindrunPackages": false,
      "whitelist": []
    },
    "blogDir": "src/mdx/blog",
    "logDir": "logs"
  }
}
```

### 2. 运行命令

```bash
# 检查翻译完整性
pnpm check-translations

# 清理未使用的翻译键（仅显示）
pnpm clean-translations

# 实际删除未使用的翻译键
pnpm clean-translations --remove

# 生成博客索引
pnpm generate-blog-index
```

## 配置选项

### 通过 package.json 配置

在 `package.json` 中添加 `devScripts` 字段：

```json
{
  "devScripts": {
    "locales": ["en", "zh", "ja"],           // 支持的语言列表
    "defaultLocale": "en",                   // 默认语言
    "messageRoot": "messages",               // 翻译文件目录
    "scan": {
      "include": ["src/**/*.{tsx,ts,jsx,js}"], // 扫描的代码目录
      "includeWindrunPackages": false,         // 是否补扫 @windrun-huaiin/* 和 tsconfig 指向 packages/*/src/* 的本地别名
      "whitelist": []                          // 精确白名单，必须逐项写完整 key
    },
    "blogDir": "src/mdx/blog",              // 博客MDX文件目录
    "logDir": "logs",                       // 日志输出目录
    "architectureExclude": ["coverage", ".env.local", "*.local"] // 项目结构图额外排除规则
  },
  "architectureConfig": {
    ".": "RootProject"
  }
}
```

### 通过配置文件

创建 `dev-scripts.config.json`：

```json
{
  "i18n": {
    "locales": ["en", "zh"],
    "defaultLocale": "en",
    "messageRoot": "messages"
  },
  "scan": {
    "include": ["src/**/*.{tsx,ts,jsx,js}"],
    "exclude": ["src/**/*.d.ts", "src/**/*.test.ts", "src/**/*.test.tsx", "node_modules/**"],
    "includeWindrunPackages": false,
    "whitelist": []
  },
  "blog": {
    "mdxDir": "src/mdx/blog",
    "outputFile": "index.mdx",
    "metaFile": "meta.json",
    "iocSlug": "ioc",
    "prefix": "blog"
  },
  "output": {
    "logDir": "logs",
    "verbose": false
  },
  "architectureExclude": ["coverage", ".env.local", "*.local"]
}
```

## 命令详解

### check-translations

检查翻译文件的完整性和一致性。

```bash
dev-scripts check-translations [options]

Options:
  -v, --verbose     显示详细日志
  --config <path>   指定配置文件路径
  -h, --help       显示帮助信息
```

**功能：**
- 扫描代码中使用的翻译键
- 检查翻译文件中是否存在对应的键
- 检查不同语言文件之间的一致性
- 生成详细的检查报告
- 支持可选补扫 `@windrun-huaiin/*` 包源码和 `tsconfig` 中映射到 `packages/*/src/*` 的本地别名

**输出示例：**
```
=== 翻译检查报告 ===

✅ en 翻译文件中包含所有使用的命名空间
✅ zh 翻译文件中包含所有使用的命名空间

🔴 en 翻译文件中缺失的键:
  - common.newFeature
  - dashboard.analytics

✅ zh 翻译文件中包含所有使用的键
```

### clean-translations

清理未使用的翻译键。

```bash
dev-scripts clean-translations [options]

Options:
  -v, --verbose     显示详细日志
  --remove          实际删除未使用的键（默认只显示）
  --config <path>   指定配置文件路径
  -h, --help       显示帮助信息
```

**功能：**
- 找出翻译文件中未在代码中使用的键
- 支持安全预览模式（默认）
- 支持实际删除模式（--remove）
- 自动清理空的命名空间对象
- 遇到动态 namespace / 动态 key 时会保守处理，优先避免误删

### 白名单

由于翻译扫描依赖 AST 分析，仍然可能存在少量误判。对于确认无需处理的结果，可以通过 `scan.whitelist` 忽略：

```json
{
  "scan": {
    "whitelist": [
      "credit.subscription.active"
    ]
  }
}
```

白名单是精确项，不是模糊规则：

- 必须逐项写完整 key
- `faq.a` 和 `faq.b` 需要分别写
- 不支持写一个 `faq` 就忽略整个 namespace

如果代码实际用了 `faq.a`、`faq.b`，但翻译里根本没有 `faq` 这个 namespace，那么白名单也必须把 `faq.a`、`faq.b` 都逐项写出来。这样用户仍然能知道到底有哪些真实使用的翻译键，只会忽略已经人工确认的误判项。

`check-translations` 输出的白名单建议只会包含精确 key，不会输出 namespace 级别建议，避免把一整组真实缺失问题直接压掉。

命令在发现问题时，会在终端和 log 里输出可直接复制的白名单片段。加入白名单后，后续检查报告和清理报告将不再把这些精确项作为问题输出。

### Monorepo 补扫

如果应用的翻译实际被 workspace 中的共享包消费，例如：

- `@windrun-huaiin/third-ui`
- `@windrun-huaiin/base-ui`
- `@windrun-huaiin/lib`
- `tsconfig.json` 中把 `@third-ui/*`、`@base-ui/*`、`@lib/*` 映射到 `../../packages/*/src/*`

那么建议开启：

```json
{
  "scan": {
    "include": ["src/**/*.{tsx,ts,jsx,js}"],
    "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.d.ts", "node_modules/**"],
    "includeWindrunPackages": true,
    "whitelist": []
  }
}
```

开启后脚本会：

- 先扫描应用自身 `scan.include` 命中的文件
- 再根据实际 import 递归补扫相关 `@windrun-huaiin/*` 包
- 识别 `tsconfig.json` 中映射到 `packages/*/src/*` 的本地 alias
- 优先使用 workspace 里的真实包目录，避免和 `node_modules` 下的同包源码重复扫描

如果目标包只发布了构建产物、没有 `src/`，脚本会跳过该包源码扫描。测试性质代码默认不参与翻译扫描，包括 `src/**/*.test.ts` 和 `src/**/*.test.tsx`。

### generate-blog-index

生成博客索引文件和月度统计。

```bash
dev-scripts generate-blog-index [options]

Options:
  -v, --verbose     显示详细日志
  --config <path>   指定配置文件路径
  -h, --help       显示帮助信息
```

**功能：**
- 扫描博客MDX文件
- 解析frontmatter元数据
- 生成主索引页面
- 生成月度统计页面
- 自动排序和分类

### deep-clean

一键清理 node_modules、.next、dist、.turbo、pnpm-lock.yaml 等依赖和缓存目录，自动适配 monorepo 或单工程结构。

```bash
dev-scripts deep-clean [options]

Options:
  --yes           实际删除匹配到的目录（默认只预览）
  -v, --verbose   显示详细日志
  --config <path> 指定配置文件路径
  -h, --help      显示帮助信息
```

**无需任何配置，脚本会自动识别工程类型：**
- 如果当前目录下有 `pnpm-workspace.yaml`，会按 monorepo 规则清理：
  - 根 node_modules
  - packages/*/node_modules
  - apps/*/node_modules
  - .next、dist、.turbo 及其子包下的同名目录
  - pnpm-lock.yaml
- 如果没有 `pnpm-workspace.yaml`，只清理：
  - node_modules
  - .next
  - pnpm-lock.yaml

**输出示例：**
```
==============================
当前工作目录: /your/project/path
==============================
【Root directory dependencies】
🗑️  [预览] /your/project/path/node_modules
...
如需实际删除，请加 --yes 参数。
```

实际删除时：
```
✅ 已删除: /your/project/path/node_modules
✅ 已删除: /your/project/path/pnpm-lock.yaml
...
✅ 共清理 3 个目录或文件。
```

### backend-core

为 `@windrun-huaiin/backend-core` 提供路由壳生成与 Prisma 模型合并（需先安装 backend-core，可在 workspace/项目内被 resolve）。

```bash
dev-scripts backend-core routes:list
dev-scripts backend-core routes:sync --app-dir src/app --force
dev-scripts backend-core prisma:sync --schema prisma/schema.prisma
dev-scripts backend-core migrations:sync --dest prisma --force
```

- `routes:sync`：在 `app/api` 下生成代理文件，默认 app 目录为 `src/app`，默认跳过已存在文件，`--force` 强制覆盖。
- `prisma:sync`：把包内模型追加到宿主 schema（默认 `prisma/schema.prisma`），并用宿主 datasource 的 schema 名替换 `@@schema("nextai")`。
- `migrations:sync`：将包内 `migrations/*.sql` 复制到指定目录（默认 `prisma/`，默认跳过已存在，`--force` 可覆盖）。

## 支持的翻译模式

脚本支持多种翻译使用模式：

```typescript
// useTranslations hook
const t = useTranslations('common')
t('welcome')

// getTranslations (服务端)
const t = await getTranslations('common')
t('welcome')

// 带参数的getTranslations
const t = await getTranslations({ locale, namespace: 'common' })
t('welcome')

// FormattedMessage组件
<FormattedMessage id="welcome" />

// 模板字符串（动态键）
t(`tags.${tagName}`)

// 变量键
t(menuItem.key)
```

## 项目结构要求

### 翻译文件结构

```
messages/
├── en.json          # 英文翻译
├── zh.json          # 中文翻译
└── ja.json          # 日文翻译（可选）
```

翻译文件格式：
```json
{
  "common": {
    "welcome": "Welcome",
    "goodbye": "Goodbye"
  },
  "dashboard": {
    "title": "Dashboard",
    "analytics": {
      "title": "Analytics",
      "views": "Views"
    }
  }
}
```

### 博客文件结构

```
src/mdx/blog/
├── index.mdx        # 自动生成的索引文件
├── ioc.mdx         # 自动生成的月度统计
├── meta.json       # 特色文章配置
├── 2024-01-01.mdx  # 博客文章
├── 2024-01-15.mdx
└── ...
```

博客文章frontmatter格式：
```markdown
---
title: "文章标题"
description: "文章描述"
icon: "BookOpen"
date: "2024-01-01"
---

文章内容...
```

## 集成示例

### GitHub Actions

```yaml
name: Check Translations
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run check-translations
```

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "dev-scripts check-translations"
    }
  }
}
```

## 后续安全计划

当前 `dev-scripts` 的主要定位仍然是开发阶段工具。翻译检查、翻译清理这类命令主要是本地读写，风险较低；但部分脚手架和更新类命令天然带有更高的信任要求，后续会继续加强交互式风险提示与确认。

### 风险分级

- 高风险: `diaomao-update`
  - 会读取远程更新源
  - 会修改本地 `package.json` 或 `pnpm-workspace.yaml`
  - 更新后会继续执行依赖安装
  - 这类能力本质上依赖用户对维护者和远程源的信任

- 中风险: `create-diaomao-app`
  - 会从 npm 拉取模板包
  - 会解包并写入目标目录
  - 会自动安装依赖并初始化 git 仓库
  - 适合脚手架场景，但需要把联网、安装、初始化等行为明确告知用户

- 低风险: `deep-clean`
  - 不涉及远程读取
  - 但属于破坏性命令，会删除依赖目录、构建产物和锁文件
  - 风险主要来自误操作，而不是供应链

### 计划中的控制措施

后续会逐步将高风险和中风险命令改造成基于终端交互的执行流程，例如使用 `clack/prompts` 在执行前逐步提示并要求用户确认：

- 当前将访问的远程地址
- 当前将修改的本地文件
- 当前将执行的安装命令
- 当前将执行的初始化或同步操作

只有在用户明确确认后，相关步骤才会继续执行；否则流程中止。这样可以降低误操作和隐式执行带来的风险，并让开发工具的行为边界更清晰。

## 故障排除

### 常见问题

1. **找不到翻译文件**
   - 检查 `messageRoot` 配置是否正确
   - 确保翻译文件存在且为有效JSON格式

2. **扫描不到代码文件**
   - 检查 `scanDirs` 配置是否包含正确的glob模式
   - 确保文件路径相对于项目根目录

3. **翻译键检测不准确**
   - 当前基于正则表达式匹配，对于复杂的动态键可能需要手动处理
   - 使用命名规范来帮助脚本识别（如 t1, t2 用于不同命名空间）

### 调试模式

使用 `--verbose` 选项获取详细日志：

```bash
dev-scripts check-translations --verbose
```

这将显示：
- 扫描的文件列表
- 找到的翻译函数映射
- 提取的翻译键
- 详细的检查过程

## 许可证

MIT License 


## Showcase

- [Free Trivia Game](https://freetrivia.info/)
- [Music Poster](https://musicposter.org/en)
- [Image Narration](https://imagenarration.com/en)
- [Describe Yourself](https://describeyourself.org/en)
- [Newspaper Template](https://newspaper-template.org/en)
- [breathing exercise](https://breathingexercise.net/en)
- [ai directory list](https://aidirectorylist.com/en)
- [reve image directory](https://reveimage.directory/en)
