import { DevScriptsConfig, DEFAULT_CONFIG } from '@dev-scripts/config/schema'
import { readJsonFile } from '@dev-scripts/utils/file-scanner'
import { Logger } from '@dev-scripts/utils/logger'
import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

function getCurrentDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function generateNextjsArchitecture(
  config: DevScriptsConfig,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const logger = new Logger(config)
  try {
    // get logs directory and blog directory
    const logsDir = join(cwd, config.output?.logDir || 'logs')
    const blogDir = join(cwd, config.blog?.mdxDir || 'src/mdx/blog')
    if (!existsSync(logsDir)) mkdirSync(logsDir, { recursive: true })
    if (!existsSync(blogDir)) mkdirSync(blogDir, { recursive: true })

    // generate tree result to logs directory
    const treeJsonPath = join(logsDir, 'project_tree.json')
    logger.log(`Running tree command to generate ${treeJsonPath}`)
    execSync(`tree -a -J -I '.next|node_modules|logs|dist|pnpm-lock.yaml|turbo|.turbo|public|.cursor|.DS_Store|.git' > ${treeJsonPath}`)

    // read tree result
    const tree = readJsonFile<any[]>(treeJsonPath)
    if (!tree) {
      logger.error('Failed to read tree JSON result!')
      return 1
    }
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
    const filesContent = renderTree(tree)
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
    return 1
  }
} 