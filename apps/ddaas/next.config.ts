import createNextIntlPlugin from 'next-intl/plugin';
import { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Monorepo development config
  transpilePackages: [
    '@windrun-huaiin/base-ui',
    '@windrun-huaiin/third-ui',
    '@windrun-huaiin/lib',
    '@windrun-huaiin/fumadocs-local-md',
  ],
  
  // mdx config
  reactStrictMode: true,

  images: {
    unoptimized: true,
    // allow remote image host
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'favicon.im',
      },
      {
        protocol: 'https',
        hostname: 'preview.reve.art',
      }
    ],
    // allow remote svg image
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Ensuring outputFileTracingIncludes is a top-level property
  outputFileTracingIncludes: {
    '/api/docs/llm-content': ['./src/mdx/docs/**/*', './.source/**/*'],
    '/api/blog/llm-content': ['./src/mdx/blog/**/*', './.source/**/*'],
    '/api/legal/llm-content': ['./src/mdx/legal/**/*', './.source/**/*'],
    '/[locale]/docs/[...slug]': ['./.source/**/*'],
    '/[locale]/blog/[[...slug]]': ['./.source/**/*'],
    '/[locale]/legal/[[...slug]]': ['./.source/**/*'],
  },

  outputFileTracingExcludes: {
    '*': [
      './tsconfig.tsbuildinfo',
      './tsconfig.json',
      './tsconfig.node.json',
      './dev-scripts.config.json',
      './components.json',
      './eslint.config.js',
      './postcss.config.mjs',
      './next.config.ts',
      './CHANGELOG.md',
      './LICENSE',
      './logs/**/*',
      './github/**/*',
      './database/**/*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_engine_*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb.*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.mysql.*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.sqlite.*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver.*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.postgresql.js',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/@prisma/client/runtime/query_compiler_bg.postgresql.wasm-base64.js',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/libquery_engine-*',
      '../../node_modules/.pnpm/@prisma+client*/node_modules/.prisma/client/query_engine_*',
    ],
  }
};

export default withNextIntl(nextConfig);
