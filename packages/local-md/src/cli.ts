#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildLocalMdSources } from './md-build/index';
import { createDefaultLocalMdBuildOptions } from './md-build/defaults';

async function main() {
  const [command] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command !== 'build') {
    throw new Error(`unsupported command: ${command}`);
  }

  const appRoot = process.cwd();
  const sourceRootDir = 'src/mdx';
  const sourceKeys = await discoverSourceKeys(appRoot, sourceRootDir);

  if (sourceKeys.length === 0) {
    throw new Error(`no content sources found under ${path.join(appRoot, sourceRootDir)}`);
  }

  await buildLocalMdSources({
    sourceKeys,
    appRoot,
    sourceRootDir,
    ...createDefaultLocalMdBuildOptions(),
  });

  console.log(`[local-md] generated .source for: ${sourceKeys.join(', ')}`);
}

async function discoverSourceKeys(appRoot: string, sourceRootDir: string) {
  const root = path.join(appRoot, sourceRootDir);
  const entries = await fs.readdir(root, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function printHelp() {
  console.log(`
Usage:
  local-md build

Conventions:
  - current working directory is treated as app root
  - content root defaults to src/mdx
  - outputs are written to .source
  `);
}

main().catch((error) => {
  console.error('[local-md] build failed', error);
  process.exitCode = 1;
});
