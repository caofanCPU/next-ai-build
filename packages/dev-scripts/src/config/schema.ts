export interface DevScriptsConfig {
  // i18n config
  i18n: {
    locales: string[]
    defaultLocale: string
    messageRoot: string
  }
  
  // scan config
  scan: {
    include: string[]
    exclude?: string[]
    baseDir?: string
  }
  
  // blog config
  blog?: {
    mdxDir: string
    outputFile?: string
    metaFile?: string
    iocSlug?: string
    prefix?: string
  }
  
  // output config
  output: {
    logDir: string
    verbose?: boolean
  }

  // architecture anotion config
  architectureConfig?: Record<string, string>
}

export interface PackageJsonDevScripts {
  locales?: string[]
  defaultLocale?: string
  messageRoot?: string
  scanDirs?: string[]
  blogDir?: string
  logDir?: string
}

export const DEFAULT_CONFIG: DevScriptsConfig = {
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    messageRoot: 'messages'
  },
  scan: {
    include: ['src/**/*.{tsx,ts,jsx,js}'],
    exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'node_modules/**']
  },
  blog: {
    mdxDir: 'src/mdx/blog',
    outputFile: 'index.mdx',
    metaFile: 'meta.json',
    iocSlug: 'ioc',
    prefix: 'blog'
  },
  output: {
    logDir: 'logs',
    verbose: false
  },
  architectureConfig: {
    ".": "项目根目录",
    ".env.local": "本地环境变量配置",
    ".eslintrc.json": "ESLint 代码规范配置",
    ".gitignore": "Git忽略文件配置",
    ".source": "Fuma数据源Build产物",
    "CHANGELOG.md": "变更记录",
    "components.json": "组件依赖清单",
    "dev-scripts.config.json": "dev-scripts脚本工具配置",
    "LICENSE": "开源许可证",
    "messages": "翻译目录",
    "next-env.d.ts": "Next.js环境类型声明",
    "next.config.ts": "Next.js项目配置",
    "package.json": "项目依赖与脚本",
    "postcss.config.mjs": "PostCSS 配置",
    "source.config.ts": "Fuma数据源扫描配置",
    "src": "源码目录",
    "tsconfig.json": "TypeScript配置",
    "tsconfig.node.json": "Node.js相关TypeScript 配置",
    "logs": "日志输出目录",
    "apps": "Monorepo多应用目录",
    "packages": "子工程组件库目录",
    "README.md": "项目说明文档",
    "app": "Next.js 应用主入口目录",
    "components": "页面组件",
    "lib": "工具包",
    "mdx": "FumaMDX文档",
    "middleware.ts": "旧版中间件入口",
    "proxy.ts": "中间件入口",
    "i18n.ts": "多语言配置",
    "globals.css": "全局样式",
    "layout.config.tsx": "布局配置",
    "layout.tsx": "布局",
    "loading.tsx": "全局加载组件",
    "hero.tsx": "首页大字组件",
    "mdx-components.tsx": "FumaMDX组件库(自定义)",
    "llm-content": "FumaMDX复制接口",
    "[locale]": "Nextjs i18n路由目录",
    "(clerk)": "Clerk认证",
    "(home)": "首页",
    "[...catchAll]": "全局404页面",
    "blog": "博客",
    "docs": "文档",
    "legal": "法律",
    "api": "API接口",
    "robots.ts": "robots.txt生成脚本",
    "sitemap.ts": "网站地图",
    "appConfig.ts": "应用全局配置",
    "site-config.ts": "网站图标配置",
    "ioc.mdx": "月度/统计",
    "meta.json": "FumaMDX元数据",
    "readme.mdx": "Next.js项目结构",
    ".github": "GitHub 配置目录",
    "workflows": "CI/CD 工作流配置",
    "fumadocs-ui@15.3.3.patch": "fumadocs-ui版本15.3.3补丁",
    "fumadocs-ui@16.0.9.patch": "fumadocs-ui版本16.0.9补丁",
    "fumadocs-core@16.0.9.patch": "fumadocs-core版本16.0.9补丁",
    ".env.local.txt": "config example"
  }
} 