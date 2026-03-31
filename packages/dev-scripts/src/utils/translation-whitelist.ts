import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'

export function filterWhitelistedItems(items: string[], config: DevScriptsConfig): string[] {
  const whitelist = new Set(config.scan.whitelist || [])
  return items.filter(item => !whitelist.has(item))
}

export function getNewWhitelistCandidates(items: string[], config: DevScriptsConfig): string[] {
  const whitelist = new Set(config.scan.whitelist || [])
  return Array.from(new Set(items.filter(item => !whitelist.has(item)))).sort()
}

export function logWhitelistSuggestion(
  items: string[],
  logger: Logger,
  config?: DevScriptsConfig
): void {
  const values = config ? getNewWhitelistCandidates(items, config) : items

  if (values.length === 0) {
    return
  }

  logger.warn('whitelist suggestion for exact items:')
  logger.warn('  "scan": {')
  logger.warn('    "whitelist": [')
  values.forEach(item => {
    logger.warn(`      "${item}",`)
  })
  logger.warn('    ]')
  logger.warn('  }')
}
