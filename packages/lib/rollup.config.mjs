import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

// Define export point
const entries = [
  'src/index.ts',
  'src/utils.ts',
  'src/llm-utils.ts',
  'src/common-app-config.ts'
];

const baseConfig = {
  external: [
    'react',
    'react-dom',
    /^react\//,
    /^react-dom\//,
    'date-fns',
    'remark',
    'remark-gfm',
    'remark-mdx',
    'remark-frontmatter',
    'unist-util-visit',
    'clsx',
    'tailwind-merge'
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      rootDir: 'src',
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
      module: 'esnext'
    })
  ]
};

const onwarn = (warning, warn) => {
  // ignore warnings
  if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
    return;
  }
  warn(warning);
};

export default defineConfig([
  // ESM build
  {
    ...baseConfig,
    onwarn,
    input: entries,
    output: {
      dir: 'dist',
      format: 'es',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].mjs',
      chunkFileNames: '[name]-[hash].mjs'
    }
  },
  // CJS build
  {
    ...baseConfig,
    onwarn,
    input: entries,
    output: {
      dir: 'dist',
      format: 'cjs',
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      exports: 'named'
    }
  }
]);