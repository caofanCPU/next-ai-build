import { DevScriptsConfig, DEFAULT_CONFIG } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'

function getCurrentDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

function globToRegExp(pattern: string): RegExp {
  const normalized = pattern
    .split('*')
    .map(part => escapeRegExp(part))
    .join('.*')
  return new RegExp(`^${normalized}$`)
}

function matchesArchitectureExclude(name: string, patterns: string[]): boolean {
  return patterns.some(pattern => globToRegExp(pattern).test(name))
}

function filterTreeNodes(nodes: any[], patterns: string[]): any[] {
  const filtered: any[] = []

  for (const node of nodes) {
    if (node.name !== '.' && matchesArchitectureExclude(node.name, patterns)) {
      continue
    }

    if (node.type === 'directory' && Array.isArray(node.contents)) {
      const nextNode = {
        ...node,
        contents: filterTreeNodes(node.contents, patterns)
      }
      filtered.push(nextNode)
      continue
    }

    filtered.push(node)
  }

  return filtered
}

function compareNodes(a: any, b: any): number {
  if (a.type === b.type) {
    return a.name.localeCompare(b.name)
  }
  return a.type === 'directory' ? -1 : 1
}

function buildTreeNodes(dirPath: string, patterns: string[], logger: Logger): any[] {
  let entries
  try {
    entries = readdirSync(dirPath, { withFileTypes: true })
  } catch (error) {
    logger.warn(`Skip unreadable directory: ${dirPath} (${error})`)
    return []
  }
  const nodes: any[] = []

  for (const entry of entries) {
    if (matchesArchitectureExclude(entry.name, patterns)) {
      continue
    }

    const fullPath = join(dirPath, entry.name)

    if (entry.isDirectory()) {
      nodes.push({
        type: 'directory',
        name: entry.name,
        contents: buildTreeNodes(fullPath, patterns, logger)
      })
      continue
    }

    if (entry.isFile()) {
      nodes.push({
        type: 'file',
        name: entry.name
      })
      continue
    }

    // Keep non-directory entries visible with file semantics.
    nodes.push({
      type: 'file',
      name: entry.name
    })
  }

  return nodes.sort(compareNodes)
}

function buildProjectTree(cwd: string, patterns: string[], logger: Logger): any[] {
  return [
    {
      type: 'directory',
      name: '.',
      contents: buildTreeNodes(cwd, patterns, logger)
    }
  ]
}

export async function generateNextjsArchitecture(
  config: DevScriptsConfig,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const logger = new Logger(config)
  try {
    const architectureExclude = Array.from(
      new Set([
        ...(DEFAULT_CONFIG.architectureExclude || []),
        ...(config.architectureExclude || [])
      ])
    )

    // get logs directory and blog directory
    const logsDir = join(cwd, config.output?.logDir || 'logs')
    const blogDir = join(cwd, config.blog?.mdxDir || 'src/mdx/blog')
    if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true })
    if (!existsSync(blogDir)) mkdirSync(blogDir, { recursive: true })

    // generate tree result to logs directory
    const treeJsonPath = join(logsDir, 'project_tree.json')
    logger.log(`Scanning project structure to generate ${treeJsonPath}`)
    const tree = buildProjectTree(cwd, architectureExclude, logger)
    const filteredTree = filterTreeNodes(tree, architectureExclude)
    writeFileSync(treeJsonPath, JSON.stringify(filteredTree, null, 2), 'utf8')
    // Merge config and user first
    const userConfig = config.architectureConfig || {}
    const architectureConfig = { ...(DEFAULT_CONFIG.architectureConfig || {}), ...userConfig }

    function renderTree(nodes: any[], depth = 0, parentPath: string = ''): string {
      let mdx = ''
      for (const node of nodes) {
        const nodePath = parentPath ? `${parentPath}/${node.name}` : node.name
        const anotion = architectureConfig[node.name] || ''
        // scan root directory name='ROOT'
        const displayName = (depth === 0 && node.name === '.') ? 'ROOT' : node.name
        if (node.type === 'directory') {
          if (!node.contents || node.contents.length === 0) {
            // handle empty folder
            mdx += `${'  '.repeat(depth)}<ZiaFolder name="${displayName}" anotion="${anotion}" className="opacity-50" disabled/>\n`
          } else {
            // handle non-empty folder
            mdx += `${'  '.repeat(depth)}<ZiaFolder name="${displayName}" anotion="${anotion}" defaultOpen>\n`
            mdx += renderTree(node.contents, depth + 1, nodePath)
            mdx += `${'  '.repeat(depth)}</ZiaFolder>\n`
          }
        } else if (node.type === 'file') {
          mdx += `${'  '.repeat(depth)}<ZiaFile name="${node.name}" anotion="${anotion}" href="" />\n`
        }
      }
      return mdx
    }

    // generate frontmatter
    const frontmatter = `---\ntitle: About Project Structure\ndescription: Show all source code directories and files\nicon: Gift\ndate: ${getCurrentDateString()}\n---\n\n## Quick Started\n\n`
    // generate mdx content
    const filesContent = renderTree(filteredTree)
    const indentedFilesContent = filesContent.split('\n').map(line => line ? '  ' + line : '').join('\n')
    const mdx = frontmatter + '<Files>\n' + indentedFilesContent + '</Files>\n'
    // output to blog directory
    const outputMdxPath = join(blogDir, 'readme.mdx')
    writeFileSync(outputMdxPath, mdx)
    logger.success(`Successfully generated ${outputMdxPath}`)
    logger.saveToFile('generate-nextjs-architecture.log', cwd)
    return 0
  } catch (error) {
    logger.error(`Error generating nextjs architecture mdx: ${error}`)
    logger.saveToFile('generate-nextjs-architecture.log', cwd)
    return 1
  }
}
