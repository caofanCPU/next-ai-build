import fs from 'fs'
import path from 'path'
import { DEFAULT_CONFIG, DevScriptsConfig, PackageJsonDevScripts } from '@dev-scripts/config/schema'

/**
 * load config from package.json
 */
function loadPackageJsonConfig(cwd: string): Partial<DevScriptsConfig> | null {
  try {
    const packageJsonPath = path.join(cwd, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return null
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const devScripts: PackageJsonDevScripts = packageJson.devScripts
    
    // only return config if devScripts field actually exists
    if (!devScripts || Object.keys(devScripts).length === 0) {
      return null
    }
    
    // convert to standard config format
    const config: Partial<DevScriptsConfig> = {}
    
    if (devScripts.locales || devScripts.defaultLocale || devScripts.messageRoot || devScripts.messageGlobs) {
      config.i18n = {
        locales: devScripts.locales || DEFAULT_CONFIG.i18n.locales,
        defaultLocale: devScripts.defaultLocale || DEFAULT_CONFIG.i18n.defaultLocale,
        messageRoot: devScripts.messageRoot || DEFAULT_CONFIG.i18n.messageRoot,
        messageGlobs: devScripts.messageGlobs || undefined
      }
    }
    
    const scanConfig = devScripts.scan
    const hasLegacyScanConfig =
      devScripts.scanDirs !== undefined ||
      devScripts.includeWindrunPackages !== undefined ||
      devScripts.whitelist !== undefined ||
      devScripts.namespaceWhitelist !== undefined

    if (scanConfig || hasLegacyScanConfig) {
      config.scan = {
        include: scanConfig?.include || devScripts.scanDirs || DEFAULT_CONFIG.scan.include,
        exclude: scanConfig?.exclude || DEFAULT_CONFIG.scan.exclude,
        includeWindrunPackages: scanConfig?.includeWindrunPackages ?? devScripts.includeWindrunPackages ?? DEFAULT_CONFIG.scan.includeWindrunPackages,
        whitelist: scanConfig?.whitelist ?? devScripts.whitelist ?? DEFAULT_CONFIG.scan.whitelist,
        namespaceWhitelist: scanConfig?.namespaceWhitelist ?? devScripts.namespaceWhitelist ?? DEFAULT_CONFIG.scan.namespaceWhitelist
      }
    }
    
    if (devScripts.blogDir) {
      config.blog = {
        mdxDir: devScripts.blogDir,
        ...DEFAULT_CONFIG.blog
      }
    }
    
    if (devScripts.logDir) {
      config.output = {
        logDir: devScripts.logDir,
        verbose: DEFAULT_CONFIG.output.verbose
      }
    }

    if (devScripts.architectureExclude) {
      config.architectureExclude = devScripts.architectureExclude
    }
    return Object.keys(config).length > 0 ? config : null
  } catch (error) {
    console.warn(`Warning: Failed to load package.json config: ${error}`)
    return null
  }
}

/**
 * load config from dev-scripts.config.json file
 */
function loadConfigFile(cwd: string): Partial<DevScriptsConfig> | null {
  try {
    const configPath = path.join(cwd, 'dev-scripts.config.json')
    if (!fs.existsSync(configPath)) {
      return null
    }
    
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (error) {
    console.warn(`Warning: Failed to load dev-scripts.config.json: ${error}`)
    return null
  }
}

/**
 * deep merge config object
 */
function mergeConfig(base: DevScriptsConfig, override: Partial<DevScriptsConfig>): DevScriptsConfig {
  const result = { ...base }
  
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value) && typeof result[key as keyof DevScriptsConfig] === 'object') {
        ;(result as any)[key] = { ...(result as any)[key], ...value }
      } else {
        ;(result as any)[key] = value
      }
    }
  }
  
  return result
}

/**
 * load full config
 */
export function loadConfig(cwd: string = typeof process !== 'undefined' ? process.cwd() : '.', override: Partial<DevScriptsConfig> = {}, verbose?: boolean): DevScriptsConfig {
  let config = { ...DEFAULT_CONFIG }
  const configSources: string[] = []
  
  // 1. load dev-scripts.config.json
  const fileConfig = loadConfigFile(cwd)
  if (fileConfig) {
    config = mergeConfig(config, fileConfig)
    configSources.push('dev-scripts.config.json')
  }
  
  // 2. load package.json config
  const packageConfig = loadPackageJsonConfig(cwd)
  if (packageConfig) {
    config = mergeConfig(config, packageConfig)
    configSources.push('package.json')
  }
  
  // 3. apply any override config
  config = mergeConfig(config, override)
  if (Object.keys(override).length > 0) {
    configSources.push('runtime override')
  }
  
  // 4. print config info in verbose mode
  const shouldPrintConfig = verbose !== undefined ? verbose : config.output.verbose
  if (shouldPrintConfig) {
    // temporarily set verbose for printing
    const configForPrint = { ...config }
    configForPrint.output = { ...config.output, verbose: true }
    printConfigInfo(configForPrint, configSources, cwd)
  }
  
  return config
}

/**
 * print config information in verbose mode
 */
function printConfigInfo(config: DevScriptsConfig, sources: string[], cwd: string): void {
  console.log('\n📋 Config Information:')
  console.log(`   working directory: ${cwd}`)
  console.log(`   config sources: ${sources.length > 0 ? sources.join(' + ') : 'default config'}`)
  
  console.log('\n🌐 i18n:')
  console.log(`   locales: [${config.i18n.locales.join(', ')}]`)
  console.log(`   defaultLocale: ${config.i18n.defaultLocale}`)
  console.log(`   messageRoot: ${config.i18n.messageRoot}`)
  if (config.i18n.messageGlobs && config.i18n.messageGlobs.length > 0) {
    console.log(`   messageGlobs: [${config.i18n.messageGlobs.join(', ')}]`)
  }
  
  console.log('\n🔍 scan:')
  console.log(`   include: [${config.scan.include.join(', ')}]`)
  if (config.scan.exclude && config.scan.exclude.length > 0) {
    console.log(`   exclude: [${config.scan.exclude.join(', ')}]`)
  }
  if (config.scan.baseDir) {
    console.log(`   baseDir: ${config.scan.baseDir}`)
  }
  console.log(`   includeWindrunPackages: ${config.scan.includeWindrunPackages === true}`)
  console.log(`   whitelist: ${(config.scan.whitelist || []).length} items`)
  console.log(`   namespaceWhitelist: ${(config.scan.namespaceWhitelist || []).length} namespaces`)
  
  if (config.blog) {
    console.log('\n📝 blog:')
    console.log(`   mdxDir: ${config.blog.mdxDir}`)
    console.log(`   outputFile: ${config.blog.outputFile || 'index.mdx (default)'}`)
    console.log(`   metaFile: ${config.blog.metaFile || 'meta.json (default)'}`)
    if (config.blog.iocSlug) {
      console.log(`   iocSlug: ${config.blog.iocSlug}`)
    }
    if (config.blog.prefix) {
      console.log(`   prefix: ${config.blog.prefix}`)
    }
  }
  
  console.log('\n📤 output:')
  console.log(`   logDir: ${config.output.logDir}`)
  console.log(`   verbose: ${config.output.verbose}`)

  const userArchitectureExclude = (config.architectureExclude || []).filter(
    item => !(DEFAULT_CONFIG.architectureExclude || []).includes(item)
  )
  if (userArchitectureExclude.length > 0) {
    console.log('\n🏗 architecture:')
    console.log(`   exclude: [${userArchitectureExclude.join(', ')}]`)
  }

  if (config.diaomaoUpdate) {
    console.log('\n📦 diaomaoUpdate:')
    console.log(`   sourceUrl: ${config.diaomaoUpdate.sourceUrl || 'not set'}`)
    console.log(`   allowedPackages: [${(config.diaomaoUpdate.allowedPackages || []).join(', ')}]`)
    console.log(`   compactLog: ${config.diaomaoUpdate.compactLog !== false}`)
  }
  console.log('')
}

/**
 * validate config
 */
export function validateConfig(config: DevScriptsConfig): void {
  if (!config.i18n.locales || config.i18n.locales.length === 0) {
    throw new Error('at least one language is required')
  }
  
  if (!config.i18n.locales.includes(config.i18n.defaultLocale)) {
    throw new Error('default language must be in the supported language list')
  }

  if (config.i18n.messageGlobs !== undefined) {
    if (!Array.isArray(config.i18n.messageGlobs) || config.i18n.messageGlobs.length === 0) {
      throw new Error('i18n.messageGlobs must be a non-empty array when provided')
    }
  }
  
  if (config.scan.include.length === 0) {
    throw new Error('at least one scan path is required')
  }

  if (config.scan.includeWindrunPackages !== undefined && typeof config.scan.includeWindrunPackages !== 'boolean') {
    throw new Error('scan.includeWindrunPackages must be a boolean')
  }

  if (config.scan.whitelist !== undefined && !Array.isArray(config.scan.whitelist)) {
    throw new Error('scan.whitelist must be an array')
  }

  if (config.scan.namespaceWhitelist !== undefined && !Array.isArray(config.scan.namespaceWhitelist)) {
    throw new Error('scan.namespaceWhitelist must be an array')
  }

  if (config.architectureExclude !== undefined && !Array.isArray(config.architectureExclude)) {
    throw new Error('architectureExclude must be an array')
  }

  if (config.diaomaoUpdate?.allowedPackages && !Array.isArray(config.diaomaoUpdate.allowedPackages)) {
    throw new Error('diaomaoUpdate.allowedPackages must be an array')
  }
}
