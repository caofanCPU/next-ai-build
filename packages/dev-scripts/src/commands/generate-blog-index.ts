import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { readJsonFile } from '@dev-scripts/utils/file-scanner'

interface Frontmatter {
  title?: string
  description?: string
  icon?: string
  date?: string
}

interface ProcessedArticle {
  slug: string
  title: string
  description?: string
  frontmatterIcon?: string
  date?: string
}

interface MetaJson {
  pages: string[]
}

function parseFrontmatter(fileContent: string): Frontmatter {
  const frontmatter: Frontmatter = {}
  const match = fileContent.match(/^---([\s\S]*?)---/)
  if (match && match[1]) {
    const lines = match[1].trim().split('\n')
    for (const line of lines) {
      const [key, ...valueParts] = line.split(':')
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim()
        if (key.trim() === 'title') frontmatter.title = value
        if (key.trim() === 'description') frontmatter.description = value
        if (key.trim() === 'icon') frontmatter.icon = value
        if (key.trim() === 'date') frontmatter.date = value
      }
    }
  }
  return frontmatter
}

function getIconComponentString(iconName?: string): string | undefined {
  if (!iconName) return undefined
  return `<${iconName} />`
}

function getCurrentDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateFrontmatterDate(frontmatter: string): string {
  const currentDate = getCurrentDateString()
  
  // Check if date field exists
  if (frontmatter.includes('date:')) {
    // Replace existing date
    return frontmatter.replace(/date:\s*[^\n]*/, `date: ${currentDate}`)
  } else {
    // Add date field before the closing ---
    return frontmatter.replace(/---$/, `date: ${currentDate}\n---`)
  }
}

function getBlogPrefix(config: DevScriptsConfig): string {
  if (config.blog?.prefix === undefined || config.blog?.prefix === null) {
    return 'blog';
  } else if (typeof config.blog?.prefix === 'string' && config.blog?.prefix.trim() === '') {
    return '';
  } else {
    return String(config.blog.prefix).trim();
  }
}

async function getAllBlogArticles(blogDir: string, cwd: string, logger: Logger): Promise<ProcessedArticle[]> {
  const articles: ProcessedArticle[] = []
  const blogPath = join(cwd, blogDir)
  
  try {
    const files = readdirSync(blogPath)
    for (const file of files) {
      if (file.endsWith('.mdx') && file !== 'index.mdx') {
        const slug = file.replace(/\.mdx$/, '')
        const filePath = join(blogPath, file)
        try {
          const content = readFileSync(filePath, 'utf-8')
          const fm = parseFrontmatter(content)

          if (!fm.title) {
            logger.warn(`Article "${file}" is missing a title in its frontmatter. Skipping.`)
            continue
          }

          articles.push({
            slug,
            title: fm.title,
            description: fm.description,
            frontmatterIcon: fm.icon,
            date: fm.date,
          })
        } catch (readError) {
          logger.warn(`Could not read or parse frontmatter for "${file}": ${readError}`)
        }
      }
    }
  } catch (dirError) {
    logger.error(`Could not read blog directory: ${dirError}`)
    return []
  }
  return articles
}

export async function generateBlogIndex(
  config: DevScriptsConfig,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const logger = new Logger(config)
  logger.warn('==============================')
  logger.warn(`‼️  Current working directory: ⭕  ${cwd}  ⭕`)
  logger.warn('==============================')
  try {
    if (!config.blog) {
      logger.error('Blog configuration is missing. Please configure blog settings.')
      return 1
    }

    logger.log('Starting to generate blog index...')

    const blogPath = join(cwd, config.blog.mdxDir)
    const indexFile = join(blogPath, config.blog.outputFile || 'index.mdx')
    const metaFile = join(blogPath, config.blog.metaFile || 'meta.json')
    const iocFile = join(blogPath, `${config.blog.iocSlug || 'ioc'}.mdx`)
    const iocSlug = config.blog.iocSlug || 'ioc'
    const blogPrefix = getBlogPrefix(config)

    let meta: MetaJson = { pages: [] }
    const metaContent = readJsonFile<MetaJson>(metaFile)
    if (metaContent) {
      meta = metaContent
    } else {
      logger.warn(`Could not read or parse ${metaFile}. No articles will be marked as featured.`)
    }
    
    const hiddenSlugs = new Set(
      meta.pages.filter(p => p.startsWith('!')).map(p => p.slice(1))
    )
    // ioc handle
    const featuredSlugs = meta.pages
      .filter(p => !p.startsWith('!'))
      .map(p => p.endsWith('.mdx') ? p.slice(0, -4) : p)
      .filter(slug => slug !== 'index' && slug !== '...')
    logger.log(`Featured slugs (meta-config): ${featuredSlugs.join(', ')}`)

    const allArticles = await getAllBlogArticles(config.blog.mdxDir, cwd, logger)
    logger.log(`Found ${allArticles.length} all articles.`)

    const visibleArticles = allArticles.filter(a => !hiddenSlugs.has(a.slug))

    // ioc article
    const iocArticle = visibleArticles.find(a => a.slug === iocSlug)
    const filteredArticles = visibleArticles.filter(a => a.slug !== iocSlug)

    if (filteredArticles.length === 0 && featuredSlugs.length === 0) {
      logger.warn("No articles found or featured. The generated index might be empty or minimal.")
    }

    const featuredArticles: ProcessedArticle[] = []
    const pastArticles: ProcessedArticle[] = []

    filteredArticles.forEach(article => {
      if (featuredSlugs.includes(article.slug)) {
        featuredArticles.push(article)
      } else {
        pastArticles.push(article)
      }
    })

    // Sort articles by date in descending order (newest first)
    const sortByDateDesc = (a: ProcessedArticle, b: ProcessedArticle) => {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date) // Newest first
      }
      if (a.date) return -1 // Articles with date come before those without
      if (b.date) return 1  // Articles with date come before those without
      return 0 // Keep original order if both lack dates
    }

    featuredArticles.sort(sortByDateDesc)
    pastArticles.sort(sortByDateDesc)

    logger.log(`Found ${featuredArticles.length} featured articles (sorted by date).`)
    logger.log(`Found ${pastArticles.length} past articles (sorted by date).`)

    // Preserve existing frontmatter or use a default
    let currentFileFrontmatter = '---\ntitle: Blog\ndescription: Articles and thoughts about various topics.\nicon: Rss\n---'
    try {
      const currentIndexContent = readFileSync(indexFile, 'utf-8')
      const frontmatterMatch = currentIndexContent.match(/^---([\s\S]*?)---/)
      if (frontmatterMatch && frontmatterMatch[0]) {
        currentFileFrontmatter = frontmatterMatch[0]
        logger.log('Preserving existing frontmatter from index.mdx')
      }
    } catch (error) {
      logger.warn('Could not read existing index.mdx or parse its frontmatter. Using default frontmatter.')
    }

    // Update date field in frontmatter
    currentFileFrontmatter = updateFrontmatterDate(currentFileFrontmatter)

    let mdxContent = `${currentFileFrontmatter}\n\n`

    const createCard = (article: ProcessedArticle): string => {
      const iconString = getIconComponentString(article.frontmatterIcon)
      const iconProp = iconString ? `icon={${iconString}}` : ''
      
      // Escape only double quotes in title for JSX attribute
      const escapedTitle = (article.title || '').replace(/"/g, '&quot;')

      // Content of the card - should be raw, as it might be MDX
      const cardContent = article.date || article.description || '' 
      
      // Ensure there's a space before href if iconProp is present and not empty
      const finalIconProp = iconProp ? `${iconProp} ` : ''
      // refer path is /locale/blog, this is blog root dir, so here is blog/X, then you'll get /locale/blog/X
      const href = blogPrefix ? `${blogPrefix}/${article.slug}` : `${article.slug}`
      return `  <ZiaCard ${finalIconProp} href="${href}" title="${escapedTitle}">\n    ${cardContent}\n  </ZiaCard>\n`
    }

    if (featuredArticles.length > 0) {
      mdxContent += `## Feature List\n\n<Cards>\n`
      featuredArticles.forEach(article => { mdxContent += createCard(article) })
      mdxContent += `</Cards>\n\n`
    }

    if (pastArticles.length > 0) {
      mdxContent += `## Past List\n\n<Cards>\n`
      pastArticles.forEach(article => { mdxContent += createCard(article) })
      mdxContent += `</Cards>\n`
    }

    // add Monthly Summary block separately
    if (iocArticle) {
      mdxContent += `\n## Monthly Summary\n\n<Cards>\n`
      const iocHref = blogPrefix ? `${blogPrefix}/${iocSlug}` : `${iocSlug}`
      mdxContent += `  <ZiaCard href="${iocHref}" title="Overview">\n    ${getCurrentDateString()}\n  </ZiaCard>\n`
      mdxContent += `</Cards>\n`
    }

    if (featuredArticles.length === 0 && pastArticles.length === 0 && !iocArticle) {
      mdxContent += "## Ooops\nNo blog posts found yet. Stay tuned!\n"
    }

    writeFileSync(indexFile, mdxContent)
    logger.success(`Successfully generated ${indexFile}`)

    // generate monthly statistics
    await generateMonthlyBlogSummary(config, visibleArticles, iocFile, iocSlug, logger)

    logger.log('Blog index generation completed successfully!')
    logger.saveToFile('generate-blog.log', cwd)

    return 0

  } catch (error) {
    logger.error(`Error generating blog index: ${error}`)
    return 1
  }
}

/**
 * generate blog monthly statistics details
 */
async function generateMonthlyBlogSummary(
  config: DevScriptsConfig,
  articles: ProcessedArticle[],
  iocFile: string,
  iocSlug: string,
  logger: Logger
): Promise<void> {
  try {
    // filter out articles without date and slug is ioc
    const articlesWithDate = articles.filter(a => a.date && a.slug !== iocSlug)

    // group by month
    const monthMap: Record<string, {date: string, title: string, slug: string}[]> = {}
    for (const art of articlesWithDate) {
      // only take the first 7 digits yyyy-mm
      const month = art.date!.slice(0, 7)
      if (!monthMap[month]) monthMap[month] = []
      monthMap[month].push({ date: art.date!, title: art.title, slug: art.slug })
    }

    // sort months in descending order
    const sortedMonths = Object.keys(monthMap).sort((a, b) => b.localeCompare(a))

    // sort articles by date in descending order
    for (const month of sortedMonths) {
      monthMap[month].sort((a, b) => b.date.localeCompare(a.date))
    }

    // read ioc.mdx original frontmatter
    let frontmatter = ''
    try {
      const content = readFileSync(iocFile, 'utf-8')
      const match = content.match(/^---([\s\S]*?)---/)
      if (match && match[0]) frontmatter = match[0]
    } catch {
      // File doesn't exist, use default
    }

    // if there is no frontmatter, use the default
    if (!frontmatter) {
      frontmatter = '---\ntitle: Monthly Summary\ndescription: Index and Summary\n---'
    }

    // update date field in frontmatter
    frontmatter = updateFrontmatterDate(frontmatter)

    // generate content
    let mdx = `${frontmatter}\n\n\n## Overview\n<Files>\n`
    if (sortedMonths.length === 0) {
      mdx += '  <ZiaFile name="Comming Soon" className="opacity-50" disabled/>\n'
    } else {
      for (const month of sortedMonths) {
        // Folder name format YYYY-MM(article count)
        const count = monthMap[month].length
        const folderTitle = `${month}(${count})`
        // default open the latest month
        const defaultOpen = month === sortedMonths[0] ? ' defaultOpen' : ''
        mdx += `  <ZiaFolder name="${folderTitle}"${defaultOpen}>\n`
        for (const art of monthMap[month]) {
          // File name="YYYY-MM-DD(Title)" format
          const day = art.date.slice(0, 10)
          // refer path is /locale/blog/ioc, so here is ./X, then you'll get /locale/blog/X
          const href = art.slug ? `./${art.slug}` : '';
          mdx += `    <ZiaFile name="${day}(${art.title})" href="${href}" />\n`
        }
        mdx += `  </ZiaFolder>\n`
      }
    }
    mdx += '</Files>\n\n'

    writeFileSync(iocFile, mdx)
    logger.success(`Successfully generated Monthly Blog Summary: ${iocFile}`)
  } catch (error) {
    logger.error(`Error generating monthly blog summary: ${error}`)
  }
} 