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
    '/api/docs/llm-content': ['./src/mdx/docs/**/*'],
    '/api/blog/llm-content': ['./src/mdx/blog/**/*'],  
    '/api/legal/llm-content': ['./src/mdx/legal/**/*'],
    '/[locale]/docs/[...slug]': ['./src/mdx/docs/**/*'],
    '/[locale]/blog/[[...slug]]': ['./src/mdx/blog/**/*'],
    '/[locale]/legal/[[...slug]]': ['./src/mdx/legal/**/*'],
  }
};

export default withNextIntl(nextConfig);
