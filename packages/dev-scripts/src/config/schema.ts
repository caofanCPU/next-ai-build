export interface DevScriptsConfig {
  // i18n config
  i18n: {
    locales: string[]
    defaultLocale: string
    messageRoot: string
    messageGlobs?: string[]
  }
  
  // scan config
  scan: {
    include: string[]
    exclude?: string[]
    baseDir?: string
    includeWindrunPackages?: boolean
    whitelist?: string[]
    namespaceWhitelist?: string[]
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
  architectureExclude?: string[]

  // diaomao update config
  diaomaoUpdate?: {
    sourceUrl?: string
    allowedPackages?: string[]
    compactLog?: boolean
  }
}

export interface PackageJsonDevScripts {
  locales?: string[]
  defaultLocale?: string
  messageRoot?: string
  messageGlobs?: string[]
  scan?: {
    include?: string[]
    exclude?: string[]
    includeWindrunPackages?: boolean
    whitelist?: string[]
    namespaceWhitelist?: string[]
  }
  scanDirs?: string[]
  includeWindrunPackages?: boolean
  whitelist?: string[]
  namespaceWhitelist?: string[]
  blogDir?: string
  logDir?: string
  architectureExclude?: string[]
}

export const DEFAULT_CONFIG: DevScriptsConfig = {
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
    messageRoot: 'messages',
    messageGlobs: ['messages/{locale}.json']
  },
  scan: {
    include: ['src/**/*.{tsx,ts,jsx,js}'],
    exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'node_modules/**'],
    includeWindrunPackages: false,
    whitelist: [],
    namespaceWhitelist: []
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
  diaomaoUpdate: {
    sourceUrl: 'https://raw.githubusercontent.com/caofanCPU/next-ai-build/main/pnpm-workspace.yaml',
    "allowedPackages": [
      "@changesets/cli",
      "@clerk/localizations",
      "@clerk/nextjs",
      "@clerk/shared",
      "@clerk/themes",
      "@fingerprintjs/fingerprintjs",
      "@hookform/resolvers",
      "@prisma/adapter-pg",
      "@prisma/client",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
      "@tailwindcss/cli",
      "@tailwindcss/postcss",
      "@tailwindcss/typography",
      "@types/hast",
      "@types/mdx",
      "@types/node",
      "@types/nprogress",
      "@types/react",
      "@types/react-dom",
      "@typescript-eslint/parser",
      "@windrun-huaiin/contracts",
      "@windrun-huaiin/lib",
      "@windrun-huaiin/base-ui",
      "@windrun-huaiin/third-ui",
      "@windrun-huaiin/fumadocs-local-md",
      "@windrun-huaiin/backend-core",
      "@windrun-huaiin/dev-scripts",
      "autoprefixer",
      "baseline-browser-mapping",
      "class-variance-authority",
      "clsx",
      "date-fns",
      "eslint",
      "eslint-config-next",
      "eslint-plugin-unused-imports",
      "fast-glob",
      "fumadocs-core",
      "fumadocs-ui",
      "katex",
      "lucide-react",
      "mermaid",
      "next",
      "next-intl",
      "next-themes",
      "nprogress",
      "postcss",
      "prisma",
      "react",
      "react-dom",
      "react-medium-image-zoom",
      "rehype-katex",
      "remark",
      "remark-frontmatter",
      "remark-gfm",
      "remark-math",
      "remark-mdx",
      "shiki",
      "stripe",
      "svix",
      "swiper",
      "tailwind-merge",
      "tailwindcss",
      "tailwindcss-animate",
      "ts-morph",
      "ts-node",
      "typescript",
      "unist-util-visit",
      "uuid",
      "zod"
    ],
    compactLog: true
  },
  architectureExclude: [
    '.next',
    'node_modules',
    'logs',
    'dist',
    'pnpm-lock.yaml',
    'turbo',
    '.turbo',
    'public',
    '.cursor',
    '.DS_Store',
    '.git',
    '.vscode',
    '.idea',
    '.codex*',
    '.claude*',
    '.gemini*',
    '.pnpm*',
    '.aider',
    '.windsurf',
    '.roo',
    '.env*',
    '*.pem',
    '*.key',
    '*.p12',
    '*.pfx',
    '*.crt',
    '*.cer',
    '*.der',
    'id_rsa',
    'id_ed25519'
  ],
  architectureConfig: {
    ".": "Project Root Dir",
    ".env.local": "Local config",
    ".eslintrc.json": "ESLint check config",
    ".gitignore": "Git ignore config",
    "local-md": "Local-md Builder",
    "CHANGELOG.md": "Change history",
    "components.json": "UI config",
    "dev-scripts.config.json": "dev-scripts working config",
    "messages": "I18n text",
    "next-env.d.ts": "Next.js type",
    "next.config.ts": "Next.js config",
    "package.json": "dependencies",
    "postcss.config.mjs": "PostCSS config",
    "src": "Source Code Dir",
    "tsconfig.json": "TypeScript config",
    "tsconfig.node.json": "Node.js config",
    "logs": "Temp logs",
    "apps": "Monorepo apps",
    "packages": "Npm Packages Dir",
    "app": "Next.js app",
    "components": "UI components",
    "lib": "Utils",
    "i18n.ts": "I18n config",
    "robots.ts": "Robots.txt Generator",
    "sitemap.ts": "Website map for SEO",
    "ioc.mdx": "Monthly analysis",
    "readme.mdx": "Next.js Project TOC",
    ".github": "GitHub config",
    "workflows": "CI/CD workflow config",
    ".env.local.txt": "config example"
  }
} 
