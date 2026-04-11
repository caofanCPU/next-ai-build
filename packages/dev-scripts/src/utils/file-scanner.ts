import fg from 'fast-glob'
import { existsSync, readFileSync, realpathSync } from 'fs'
import path from 'path'
import { DevScriptsConfig } from '@dev-scripts/config/schema'

export interface ScanResult {
  filePath: string
  content: string
}

interface LocalPackageAlias {
  aliasPrefix: string
  packageRoot: string
}

interface WorkspaceWindrunPackageMap {
  [packageName: string]: string
}

const CODE_FILE_GLOB = '**/*.{tsx,ts,jsx,js}'
const WINDRUN_SCOPE = '@windrun-huaiin/'

function extractImportedModules(content: string): string[] {
  const modules = new Set<string>()
  const importPattern = /(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"](@windrun-huaiin\/[^'"]+)['"]|require\(\s*['"](@windrun-huaiin\/[^'"]+)['"]\s*\)|import\(\s*['"](@windrun-huaiin\/[^'"]+)['"]\s*\)/g
  let match: RegExpExecArray | null

  while ((match = importPattern.exec(content)) !== null) {
    const rawValue = match[1] || match[2] || match[3]
    if (!rawValue) {
      continue
    }

    modules.add(rawValue)
  }

  const generalImportPattern = /(?:import|export)\s+(?:[^'"]+?\s+from\s+)?['"](@[^'"]+)['"]|require\(\s*['"](@[^'"]+)['"]\s*\)|import\(\s*['"](@[^'"]+)['"]\s*\)/g
  while ((match = generalImportPattern.exec(content)) !== null) {
    const rawValue = match[1] || match[2] || match[3]
    if (rawValue) {
      modules.add(rawValue)
    }
  }

  return Array.from(modules)
}

function normalizeScopedPackageName(moduleName: string): string | null {
  const segments = moduleName.split('/')
  if (segments.length >= 2 && segments[0].startsWith('@')) {
    return `${segments[0]}/${segments[1]}`
  }
  return null
}

function findNodeModulesDir(startDir: string): string | null {
  let current = startDir

  while (true) {
    const candidate = path.join(current, 'node_modules')
    if (existsSync(candidate)) {
      return candidate
    }

    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

function findWorkspaceRoot(startDir: string): string | null {
  let current = startDir

  while (true) {
    const candidate = path.join(current, 'pnpm-workspace.yaml')
    if (existsSync(candidate)) {
      return current
    }

    const parent = path.dirname(current)
    if (parent === current) {
      return null
    }
    current = parent
  }
}

function loadWorkspaceWindrunPackages(cwd: string): WorkspaceWindrunPackageMap {
  const workspaceRoot = findWorkspaceRoot(cwd)
  if (!workspaceRoot) {
    return {}
  }

  const packagesDir = path.join(workspaceRoot, 'packages')
  if (!existsSync(packagesDir)) {
    return {}
  }

  const result: WorkspaceWindrunPackageMap = {}

  for (const dirName of fg.sync('*', { cwd: packagesDir, onlyDirectories: true })) {
    const packageJsonPath = path.join(packagesDir, dirName, 'package.json')
    if (!existsSync(packageJsonPath)) {
      continue
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string }
      if (packageJson.name?.startsWith(WINDRUN_SCOPE)) {
        result[packageJson.name] = realpathSync(path.join(packagesDir, dirName))
      }
    } catch (error) {
      console.warn(`Warning: Failed to parse workspace package config ${packageJsonPath}: ${error}`)
    }
  }

  return result
}

function resolveWindrunPackageRoot(packageName: string, cwd: string, workspacePackages: WorkspaceWindrunPackageMap): string | null {
  if (workspacePackages[packageName]) {
    return workspacePackages[packageName]
  }

  const nodeModulesDir = findNodeModulesDir(cwd)
  if (!nodeModulesDir) {
    return null
  }

  const packageDir = path.join(nodeModulesDir, ...packageName.split('/'))
  return existsSync(packageDir) ? realpathSync(packageDir) : null
}

function loadLocalPackageAliases(cwd: string): LocalPackageAlias[] {
  const tsconfigPath = path.join(cwd, 'tsconfig.json')
  if (!existsSync(tsconfigPath)) {
    return []
  }

  try {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8')) as {
      compilerOptions?: {
        paths?: Record<string, string[]>
      }
    }

    const paths = tsconfig.compilerOptions?.paths || {}
    const aliases: LocalPackageAlias[] = []

    Object.entries(paths).forEach(([aliasKey, targets]) => {
      const aliasPrefix = aliasKey.endsWith('/*') ? aliasKey.slice(0, -1) : aliasKey
      targets.forEach(target => {
        const normalizedTarget = target.endsWith('/*') ? target.slice(0, -2) : target
        const targetPath = path.resolve(cwd, normalizedTarget)
        const packageRoot = targetPath.endsWith(`${path.sep}src`) ? path.dirname(targetPath) : null

        if (!packageRoot) {
          return
        }

        if (!packageRoot.includes(`${path.sep}packages${path.sep}`)) {
          return
        }

        aliases.push({
          aliasPrefix,
          packageRoot: realpathSync(packageRoot),
        })
      })
    })

    return aliases
  } catch (error) {
    console.warn(`Warning: Failed to load tsconfig aliases from ${tsconfigPath}: ${error}`)
    return []
  }
}

function getWindrunPackageScanPatterns(packageRoot: string, cwd: string): string[] {
  const relativeRoot = path.relative(cwd, packageRoot)
  if (!relativeRoot) {
    return []
  }

  return [relativeRoot]
}

async function scanPackageSourceFiles(packageRoot: string, cwd: string, exclude: string[]): Promise<string[]> {
  const srcDir = path.join(packageRoot, 'src')
  if (!existsSync(srcDir)) {
    return []
  }

  const files = await fg(CODE_FILE_GLOB, {
    ignore: exclude,
    cwd: srcDir,
    absolute: true,
  })

  return files.map(file => path.relative(cwd, file))
}

async function findWindrunDependentFiles(
  initialFiles: string[],
  config: DevScriptsConfig,
  cwd: string
): Promise<string[]> {
  const workspacePackages = loadWorkspaceWindrunPackages(cwd)
  const localAliases = loadLocalPackageAliases(cwd)
  const discoveredPackages = new Set<string>()
  const discoveredAliasRoots = new Set<string>()
  const queuedPackages: string[] = []
  const queuedAliasRoots: string[] = []
  const packageFiles = new Set<string>()
  const filesToInspect = new Set(initialFiles)
  const processedFiles = new Set<string>()

  while (filesToInspect.size > 0) {
    const [currentFile] = filesToInspect
    filesToInspect.delete(currentFile)

    if (processedFiles.has(currentFile)) {
      continue
    }
    processedFiles.add(currentFile)

    let content = ''
    try {
      content = readFileSync(path.join(cwd, currentFile), 'utf8')
    } catch {
      continue
    }

    extractImportedModules(content).forEach(moduleName => {
      const packageName = normalizeScopedPackageName(moduleName)
      if (packageName && packageName.startsWith(WINDRUN_SCOPE) && !discoveredPackages.has(packageName)) {
        discoveredPackages.add(packageName)
        queuedPackages.push(packageName)
      }

      localAliases.forEach(alias => {
        if (moduleName === alias.aliasPrefix.slice(0, -1) || moduleName.startsWith(alias.aliasPrefix)) {
          if (!discoveredAliasRoots.has(alias.packageRoot)) {
            discoveredAliasRoots.add(alias.packageRoot)
            queuedAliasRoots.push(alias.packageRoot)
          }
        }
      })
    })

    while (queuedPackages.length > 0) {
      const packageName = queuedPackages.shift()
      if (!packageName) {
        continue
      }

      const packageRoot = resolveWindrunPackageRoot(packageName, cwd, workspacePackages)
      if (!packageRoot) {
        console.warn(`Warning: Failed to resolve windrun package ${packageName} from ${cwd}`)
        continue
      }

      const patterns = getWindrunPackageScanPatterns(packageRoot, cwd)
      if (patterns.length === 0) {
        console.warn(`Warning: Skipping windrun package ${packageName} because no src directory is available`)
        continue
      }

      const files = await scanPackageSourceFiles(packageRoot, cwd, config.scan.exclude || [])

      files.forEach(file => {
        if (!packageFiles.has(file)) {
          packageFiles.add(file)
          filesToInspect.add(file)
        }
      })
    }

    while (queuedAliasRoots.length > 0) {
      const packageRoot = queuedAliasRoots.shift()
      if (!packageRoot) {
        continue
      }

      const patterns = getWindrunPackageScanPatterns(packageRoot, cwd)
      if (patterns.length === 0) {
        continue
      }

      const files = await scanPackageSourceFiles(packageRoot, cwd, config.scan.exclude || [])

      files.forEach(file => {
        if (!packageFiles.has(file)) {
          packageFiles.add(file)
          filesToInspect.add(file)
        }
      })
    }
  }

  return Array.from(packageFiles)
}

/**
 * scan matching files
 */
export async function scanFiles(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Promise<ScanResult[]> {
  const resolvedCwd = path.resolve(cwd)
  const files: string[] = await fg(config.scan.include, {
    ignore: config.scan.exclude || [],
    cwd: resolvedCwd,
    absolute: false
  })
  const allFiles = new Set(files)

  if (config.scan.includeWindrunPackages) {
    const windrunFiles = await findWindrunDependentFiles(files, config, resolvedCwd)
    windrunFiles.forEach(file => allFiles.add(file))
  }

  const results: ScanResult[] = []
  
  for (const file of allFiles) {
    try {
      const content = readFileSync(path.join(resolvedCwd, file), 'utf8')
      results.push({
        filePath: file,
        content
      })
    } catch (error) {
      console.warn(`Warning: Failed to read file ${file}: ${error}`)
    }
  }

  return results
}

/**
 * read JSON file from given path
 */
export function readJsonFile<T = any>(filePath: string): T | null {
  try {
    const content = readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
}

/**
 * get translation file path
 */
export function getTranslationFilePath(locale: string, config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): string {
  return path.join(path.resolve(cwd), config.i18n.messageRoot, `${locale}.json`)
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMergeTranslations(
  base: Record<string, any>,
  extra: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = { ...base }

  Object.entries(extra).forEach(([key, value]) => {
    const current = result[key]

    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = deepMergeTranslations(current, value)
      return
    }

    result[key] = value
  })

  return result
}

export function getTranslationFilePatterns(locale: string, config: DevScriptsConfig): string[] {
  const patterns = config.i18n.messageGlobs && config.i18n.messageGlobs.length > 0
    ? config.i18n.messageGlobs
    : [path.join(config.i18n.messageRoot, `${locale}.json`)]

  return patterns.map(pattern => pattern.split('{locale}').join(locale))
}

export function getTranslationFilePaths(
  locale: string,
  config: DevScriptsConfig,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): string[] {
  const absoluteCwd = path.resolve(cwd)
  const patterns = getTranslationFilePatterns(locale, config)
  const matches = fg.sync(patterns, {
    cwd: absoluteCwd,
    onlyFiles: true,
    unique: true
  })

  return matches
    .map(filePath => path.join(absoluteCwd, filePath))
    .sort((left, right) => left.localeCompare(right))
}

/**
 * load all translation files
 */
export function loadTranslations(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Record<string, Record<string, any>> {
  const translations: Record<string, Record<string, any>> = {}
  
  for (const locale of config.i18n.locales) {
    const filePaths = getTranslationFilePaths(locale, config, cwd)

    if (filePaths.length === 0) {
      console.warn(`Warning: Failed to load translation file for locale: ${locale}`)
      translations[locale] = {}
      continue
    }

    translations[locale] = filePaths.reduce<Record<string, any>>((merged, filePath) => {
      const translation = readJsonFile<Record<string, any>>(filePath)

      if (!translation) {
        console.warn(`Warning: Failed to load translation file: ${filePath}`)
        return merged
      }

      return deepMergeTranslations(merged, translation)
    }, {})
  }
  
  return translations
} 
