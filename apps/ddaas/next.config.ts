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
  }
};

export default withNextIntl(nextConfig);
