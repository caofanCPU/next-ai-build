import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'rollup';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { preserveDirectives } from 'rollup-plugin-preserve-directives';
import packageJson from './package.json' with { type: 'json' };

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const resolveFromRoot = (...segments) => path.resolve(rootDir, ...segments);

// Align build entry points with package.json exports to produce per-module outputs
const entries = [
  'src/index.ts',
  'src/prisma/index.ts',
  'src/services/database/index.ts',
  'src/services/aggregate/index.ts',
  'src/services/context/index.ts',
  'src/services/stripe/index.ts',
  'src/services/ai/index.ts',
  'src/config/fingerprint.ts',
  'src/config/money-price.ts',
  'src/credit/server.ts',
  'src/pricing/server.ts',
  'src/lib/stripe-config.ts',
  'src/upstash/server.ts',
  'src/auth/auth-utils.ts',
  'src/auth/auth-shared.ts',
  'src/auth/auth-middleware.ts',
  'src/app/api/webhook/stripe/route.ts',
  'src/app/api/webhook/clerk/user/route.ts',
  'src/app/api/user/anonymous/init/route.ts',
  'src/app/api/ai/route.ts',
  'src/app/api/stripe/checkout/route.ts',
  'src/app/api/stripe/customer-portal/route.ts',
];

const externalPackages = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
];

const isExternal = (id) => {
  if (
    id === 'next' ||
    /^next\//.test(id) ||
    /^@windrun-huaiin\//.test(id)
  ) {
    return true;
  }

  return externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));
};

const createConfig = (format) => ({
  input: entries,
  external: isExternal,
  plugins: [
    alias({
      entries: [
        { find: '@core/db', replacement: resolveFromRoot('src/services/database') },
        { find: '@core/aggregate', replacement: resolveFromRoot('src/services/aggregate') },
        { find: '@core/context', replacement: resolveFromRoot('src/services/context') },
        { find: '@core/stripe', replacement: resolveFromRoot('src/services/stripe') },
        { find: '@core/lib', replacement: resolveFromRoot('src/lib') },
        { find: '@core/auth', replacement: resolveFromRoot('src/auth') },
        { find: '@core/prisma', replacement: resolveFromRoot('src/prisma') },
        { find: '@core', replacement: resolveFromRoot('src') },
      ],
    }),
    peerDepsExternal(),
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: format === 'es',
      declarationMap: format === 'es',
      declarationDir: format === 'es' ? 'dist' : undefined,
      rootDir: 'src',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      module: 'esnext',
    }),
    preserveDirectives(),
  ],
  output: {
    dir: 'dist',
    format,
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: format === 'es' ? '[name].mjs' : '[name].js',
    chunkFileNames: format === 'es' ? '[name]-[hash].mjs' : '[name]-[hash].js',
    exports: 'named',
  },
});

export default defineConfig([
  createConfig('es'),
  createConfig('cjs'),
]);
