import fs from 'fs'
import path from 'path'
import https from 'https'
import { execSync } from 'child_process'
import { parse, stringify } from 'yaml'
import semver from 'semver'
import { DevScriptsConfig } from '@dev-scripts/config/schema'

type DependencySection = 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'

interface WorkspaceCatalogFile {
  catalog?: Record<string, string>
}

interface UpdateRow {
  packageName: string
  currentVersion: string
  targetVersion: string
}

interface ResolvedTargetVersion {
  version: string
  source: 'catalog' | 'npm'
}

type SkipReason =
  | 'skipped-same'
  | 'skipped-missing'
  | 'skipped-newer'
  | 'skipped-unresolved-catalog'
  | 'skipped-uncomparable'
  | 'skipped-workspace'

interface SkipRow {
  packageName: string
  currentVersion: string
  targetVersion: string
  reason: SkipReason
}

const DEPENDENCY_SECTIONS: DependencySection[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
]

const UNKNOWN_VERSION = 'UNKNOWN'

const NPM_TARGET_PACKAGES = [
  '@windrun-huaiin/base-ui',
  '@windrun-huaiin/lib',
  '@windrun-huaiin/third-ui',
  '@windrun-huaiin/backend-core',
  '@windrun-huaiin/dev-scripts'
] as const

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      const statusCode = response.statusCode ?? 0

      if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
        response.resume()
        fetchText(response.headers.location).then(resolve).catch(reject)
        return
      }

      if (statusCode < 200 || statusCode >= 300) {
        response.resume()
        reject(new Error(`failed to fetch update source: ${statusCode}`))
        return
      }

      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => resolve(body))
    })

    request.on('error', (error) => reject(error))
  })
}

function findNearestFile(startDir: string, fileName: string): string | null {
  let currentDir = startDir

  while (true) {
    const candidate = path.join(currentDir, fileName)
    if (fs.existsSync(candidate)) {
      return candidate
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return null
    }
    currentDir = parentDir
  }
}

function stripProtocolPrefix(version: string): string {
  const protocolPrefixes = ['workspace:', 'npm:']

  for (const prefix of protocolPrefixes) {
    if (version.startsWith(prefix)) {
      return version.slice(prefix.length)
    }
  }

  return version
}

function isTagVersion(version: string): boolean {
  return version === 'latest'
}

function getComparableMinVersion(version: string): { version: string } | null {
  try {
    return semver.minVersion(version)
  } catch {
    return null
  }
}

function compareVersionSpecs(currentVersion: string, targetVersion: string): 'update' | 'same' | 'newer' | 'uncomparable' {
  const normalizedCurrent = stripProtocolPrefix(currentVersion)
  const normalizedTarget = stripProtocolPrefix(targetVersion)

  if (isTagVersion(normalizedCurrent) || isTagVersion(normalizedTarget)) {
    return 'uncomparable'
  }

  if (currentVersion === targetVersion) {
    return 'same'
  }

  if (normalizedCurrent === normalizedTarget) {
    return 'same'
  }

  const currentMin = getComparableMinVersion(normalizedCurrent)
  const targetMin = getComparableMinVersion(normalizedTarget)

  if (currentMin && targetMin) {
    const comparison = semver.compare(currentMin, targetMin)
    if (comparison > 0) {
      return 'newer'
    }
    if (comparison === 0) {
      return 'same'
    }
    return 'update'
  }

  return 'uncomparable'
}

function extractCatalog(workspaceContent: string): Record<string, string> {
  const parsed = parse(workspaceContent) as WorkspaceCatalogFile | null
  const catalog = parsed?.catalog

  if (!catalog || typeof catalog !== 'object') {
    throw new Error('catalog section not found in remote pnpm-workspace.yaml')
  }

  return catalog
}

function loadJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function loadYamlFile<T>(filePath: string): T {
  return parse(fs.readFileSync(filePath, 'utf8')) as T
}

function saveYamlFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, stringify(data), 'utf8')
}

function saveJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

function renderTable(rows: Array<UpdateRow | SkipRow>, headers: [string, string, string, string?]): string {
  const widths = [
    headers[0].length,
    headers[1].length,
    headers[2].length,
    headers[3]?.length ?? 0
  ]

  for (const row of rows) {
    widths[0] = Math.max(widths[0], row.packageName.length)
    widths[1] = Math.max(widths[1], row.currentVersion.length)
    widths[2] = Math.max(widths[2], row.targetVersion.length)
    if ('reason' in row) {
      widths[3] = Math.max(widths[3], row.reason.length)
    }
  }

  const hasFourthColumn = Boolean(headers[3])
  const border = hasFourthColumn
    ? `┌${'─'.repeat(widths[0] + 2)}┬${'─'.repeat(widths[1] + 2)}┬${'─'.repeat(widths[2] + 2)}┬${'─'.repeat(widths[3] + 2)}┐`
    : `┌${'─'.repeat(widths[0] + 2)}┬${'─'.repeat(widths[1] + 2)}┬${'─'.repeat(widths[2] + 2)}┐`
  const separator = hasFourthColumn
    ? `├${'─'.repeat(widths[0] + 2)}┼${'─'.repeat(widths[1] + 2)}┼${'─'.repeat(widths[2] + 2)}┼${'─'.repeat(widths[3] + 2)}┤`
    : `├${'─'.repeat(widths[0] + 2)}┼${'─'.repeat(widths[1] + 2)}┼${'─'.repeat(widths[2] + 2)}┤`
  const footer = hasFourthColumn
    ? `└${'─'.repeat(widths[0] + 2)}┴${'─'.repeat(widths[1] + 2)}┴${'─'.repeat(widths[2] + 2)}┴${'─'.repeat(widths[3] + 2)}┘`
    : `└${'─'.repeat(widths[0] + 2)}┴${'─'.repeat(widths[1] + 2)}┴${'─'.repeat(widths[2] + 2)}┘`

  const formatRow = (columns: string[]) => {
    if (hasFourthColumn) {
      return `│ ${columns[0].padEnd(widths[0])} │ ${columns[1].padEnd(widths[1])} │ ${columns[2].padEnd(widths[2])} │ ${columns[3].padEnd(widths[3])} │`
    }
    return `│ ${columns[0].padEnd(widths[0])} │ ${columns[1].padEnd(widths[1])} │ ${columns[2].padEnd(widths[2])} │`
  }

  return [
    border,
    formatRow(hasFourthColumn ? [headers[0], headers[1], headers[2], headers[3] || ''] : [headers[0], headers[1], headers[2]]),
    separator,
    ...rows.map((row) =>
      formatRow(
        'reason' in row
          ? [row.packageName, row.currentVersion, row.targetVersion, row.reason]
          : [row.packageName, row.currentVersion, row.targetVersion]
      )
    ),
    footer
  ].join('\n')
}

function printSkipDetails(skipRows: SkipRow[], compactLog: boolean): void {
  const newerCount = skipRows.filter((row) => row.reason === 'skipped-newer').length

  if (compactLog) {
    if (newerCount > 0) {
      console.log(`Skipped ${newerCount} package(s) because local versions are newer than the source.`)
    }
    return
  }

  if (skipRows.length === 0) {
    return
  }

  console.log('\nSkipped:')
  console.log(renderTable(skipRows, ['Package', 'Before', 'After', 'Reason']))
}

function resolveTargetVersions(
  remoteCatalog: Record<string, string>,
  allowedPackages: string[],
  compactLog: boolean
): Record<string, ResolvedTargetVersion> {
  const resolvedTargets: Record<string, ResolvedTargetVersion> = {}
  const npmPackagesToResolve = NPM_TARGET_PACKAGES.filter((packageName) => allowedPackages.includes(packageName))

  for (const [packageName, version] of Object.entries(remoteCatalog)) {
    resolvedTargets[packageName] = {
      version,
      source: 'catalog'
    }
  }

  for (const packageName of npmPackagesToResolve) {
    const command = `npm view ${packageName} version`

    if (!compactLog) {
      console.log(`[diaomao-update] resolving via npm: ${command}`)
    }

    try {
      const version = execSync(command, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }).trim() || UNKNOWN_VERSION

      resolvedTargets[packageName] = {
        version,
        source: 'npm'
      }

      if (!compactLog) {
        console.log(`[diaomao-update] resolved ${packageName}: ${version}`)
      }
    } catch (error) {
      resolvedTargets[packageName] = {
        version: UNKNOWN_VERSION,
        source: 'npm'
      }

      if (!compactLog) {
        const stderr = error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
          ? error.stderr.trim()
          : String(error)
        console.log(`[diaomao-update] resolved ${packageName}: ${UNKNOWN_VERSION}`)
        console.log(`[diaomao-update] npm query failed for ${packageName}: ${stderr || 'unknown error'}`)
      }
    }
  }

  return resolvedTargets
}

export async function diaomaoUpdate(
  config: DevScriptsConfig,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const updateConfig = config.diaomaoUpdate || {}
  const sourceUrl = updateConfig.sourceUrl || ''
  const allowedPackages = updateConfig.allowedPackages || []
  const compactLog = updateConfig.compactLog !== false

  if (!sourceUrl) {
    throw new Error('diaomaoUpdate.sourceUrl is required')
  }

  if (!Array.isArray(allowedPackages) || allowedPackages.length === 0) {
    throw new Error('diaomaoUpdate.allowedPackages must contain at least one package name')
  }

  const packageJsonPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${cwd}`)
  }

  const localWorkspacePath = findNearestFile(cwd, 'pnpm-workspace.yaml')
  const packageJson = loadJsonFile<Record<string, any>>(packageJsonPath)
  const localWorkspace = localWorkspacePath ? loadYamlFile<WorkspaceCatalogFile>(localWorkspacePath) : null
  const localCatalog = localWorkspace?.catalog || {}

  console.log(`Reading update source: ${sourceUrl}`)
  const remoteWorkspaceContent = await fetchText(sourceUrl)
  const remoteCatalog = extractCatalog(remoteWorkspaceContent)
  const resolvedTargets = resolveTargetVersions(remoteCatalog, allowedPackages, compactLog)

  const updatedRows: UpdateRow[] = []
  const skipRows: SkipRow[] = []

  let packageJsonChanged = false
  let workspaceChanged = false

  for (const packageName of allowedPackages) {
    const resolvedTarget = resolvedTargets[packageName]
    const targetVersion = resolvedTarget?.version

    if (!targetVersion) {
      continue
    }

    let matched = false

    for (const section of DEPENDENCY_SECTIONS) {
      const dependencies = packageJson[section] as Record<string, string> | undefined
      if (!dependencies || !(packageName in dependencies)) {
        continue
      }

      matched = true
      const currentSpecifier = dependencies[packageName]

      if (currentSpecifier.startsWith('workspace:')) {
        skipRows.push({
          packageName,
          currentVersion: currentSpecifier,
          targetVersion,
          reason: 'skipped-workspace'
        })
        continue
      }

      if (currentSpecifier === 'catalog:') {
        const localCatalogVersion = localCatalog[packageName]
        if (!localCatalogVersion) {
          skipRows.push({
            packageName,
            currentVersion: currentSpecifier,
            targetVersion,
            reason: 'skipped-unresolved-catalog'
          })
          continue
        }

        const decision = compareVersionSpecs(localCatalogVersion, targetVersion)

        if (decision === 'newer') {
          skipRows.push({
            packageName,
            currentVersion: localCatalogVersion,
            targetVersion,
            reason: 'skipped-newer'
          })
          continue
        }

        if (decision === 'same') {
          skipRows.push({
            packageName,
            currentVersion: localCatalogVersion,
            targetVersion,
            reason: 'skipped-same'
          })
          continue
        }

        if (decision === 'uncomparable') {
          skipRows.push({
            packageName,
            currentVersion: localCatalogVersion,
            targetVersion,
            reason: 'skipped-uncomparable'
          })
          continue
        }

        localCatalog[packageName] = targetVersion
        workspaceChanged = true
        updatedRows.push({
          packageName,
          currentVersion: localCatalogVersion,
          targetVersion
        })

        if (!compactLog) {
          console.log(`[diaomao-update] updated ${packageName} from ${localCatalogVersion} to ${targetVersion} (source: ${resolvedTarget.source})`)
        }
        continue
      }

      const decision = compareVersionSpecs(currentSpecifier, targetVersion)

      if (decision === 'newer') {
        skipRows.push({
          packageName,
          currentVersion: currentSpecifier,
          targetVersion,
          reason: 'skipped-newer'
        })
        continue
      }

      if (decision === 'same') {
        skipRows.push({
          packageName,
          currentVersion: currentSpecifier,
          targetVersion,
          reason: 'skipped-same'
        })
        continue
      }

      if (decision === 'uncomparable') {
        skipRows.push({
          packageName,
          currentVersion: currentSpecifier,
          targetVersion,
          reason: 'skipped-uncomparable'
        })
        continue
      }

      dependencies[packageName] = targetVersion
      packageJsonChanged = true
      updatedRows.push({
        packageName,
        currentVersion: currentSpecifier,
        targetVersion
      })

      if (!compactLog) {
        console.log(`[diaomao-update] updated ${packageName} from ${currentSpecifier} to ${targetVersion} (source: ${resolvedTarget.source})`)
      }
    }

    if (!matched) {
      skipRows.push({
        packageName,
        currentVersion: '-',
        targetVersion,
        reason: 'skipped-missing'
      })
    }
  }

  if (workspaceChanged && localWorkspacePath && localWorkspace) {
    localWorkspace.catalog = localCatalog
    saveYamlFile(localWorkspacePath, localWorkspace)
  }

  if (packageJsonChanged) {
    saveJsonFile(packageJsonPath, packageJson)
  }

  if (updatedRows.length > 0) {
    console.log('\nResults:')
    console.log(renderTable(updatedRows, ['Package', 'Before', 'After']))
  } else {
    console.log('\nResults:')
    console.log('No package versions were updated.')
  }

  console.log('')
  console.log(`Updated ${updatedRows.length} package version(s).`)
  printSkipDetails(skipRows, compactLog)

  if (updatedRows.length > 0) {
    console.log('\n执行 pnpm install中...')
    execSync('pnpm install', {
      cwd,
      stdio: 'inherit'
    })
  }

  return 0
}
