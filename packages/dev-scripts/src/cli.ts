#!/usr/bin/env node

import { program } from 'commander'
import { loadConfig, validateConfig } from '@dev-scripts/config'
import { checkTranslations } from '@dev-scripts/commands/check-translations'
import { cleanTranslations } from '@dev-scripts/commands/clean-translations'
import { generateBlogIndex } from '@dev-scripts/commands/generate-blog-index'
import { deepClean } from '@dev-scripts/commands/deep-clean'
import { easyChangeset } from '@dev-scripts/commands/easy-changeset'
import { generateNextjsArchitecture } from '@dev-scripts/commands/generate-nextjs-architecture'
import { createDiaomaoApp } from '@dev-scripts/commands/create-diaomao-app'
import { registerBackendCoreCommands } from '@dev-scripts/commands/backend-core'

// get current working directory, ensure it works in Node.js environment
const cwd = typeof process !== 'undefined' ? process.cwd() : '.'

program
  .name('dev-scripts')
  .description('development scripts for multi-language projects')
  .version('5.0.0')

program
  .command('check-translations')
  .description('check the completeness and consistency of translation files')
  .option('-v, --verbose', 'show detailed logs', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      
      // apply verbose option after loading
      if (options.verbose) {
        config.output.verbose = true
      }
      
      validateConfig(config)
      
      const exitCode = await checkTranslations(config, cwd)
      
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('clean-translations')
  .description('clean unused translation keys')
  .option('-v, --verbose', 'show detailed logs', false)
  .option('--remove', 'actually delete unused keys (default only show)', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      
      // apply verbose option after loading
      if (options.verbose) {
        config.output.verbose = true
      }
      
      validateConfig(config)
      
      const exitCode = await cleanTranslations(config, options.remove, cwd)
      
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('generate-blog-index')
  .description('generate blog index file')
  .option('-v, --verbose', 'show detailed logs', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      
      // apply verbose option after loading
      if (options.verbose) {
        config.output.verbose = true
      }
      
      validateConfig(config)
      
      const exitCode = await generateBlogIndex(config, cwd)
      
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('deep-clean')
  .description('clean all node_modules, dist, .next, .turbo and related caches in monorepo')
  .option('--yes', 'actually delete matched directories (default only preview)', false)
  .option('-v, --verbose', 'show detailed logs', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      if (options.verbose) {
        config.output.verbose = true
      }
      validateConfig(config)
      const exitCode = await deepClean(config, options.yes, cwd)
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('easy-changeset')
  .description('copy .changeset/d8-template.mdx to .changeset/d8-template.md if both exist')
  .action(async () => {
    try {
      const exitCode = await easyChangeset(cwd)
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('generate-nextjs-architecture')
  .description('generate nextjs-architecture.mdx for project structure')
  .option('-v, --verbose', 'show detailed logs', false)
  .action(async (options) => {
    try {
      const config = loadConfig(cwd, {}, options.verbose)
      if (options.verbose) {
        config.output.verbose = true
      }
      validateConfig(config)
      const exitCode = await generateNextjsArchitecture(config, cwd)
      if (typeof process !== 'undefined') {
        process.exit(exitCode)
      }
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

program
  .command('create-diaomao-app <project-name>')
  .description('create a new diaomao app from template')
  .option('-s, --schema <name>', 'Database schema name (optional, defaults to project name)')
  .action(async (projectName, options) => {
    try {
      await createDiaomaoApp(projectName, options)
    } catch (error) {
      console.error('Error:', error)
      if (typeof process !== 'undefined') {
        process.exit(1)
      }
    }
  })

registerBackendCoreCommands(program)

// parse command line arguments
if (typeof process !== 'undefined') {
  program.parse(process.argv)
}
