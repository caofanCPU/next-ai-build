import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'

function isWhitelistedByNamespace(item: string, config: DevScriptsConfig): boolean {
  const namespaceWhitelist = config.scan.namespaceWhitelist || []
  return namespaceWhitelist.some(namespace => item === namespace || item.startsWith(`${namespace}.`))
}

export function filterWhitelistedItems(items: string[], config: DevScriptsConfig): string[] {
  const whitelist = new Set(config.scan.whitelist || [])
  return items.filter(item => !whitelist.has(item) && !isWhitelistedByNamespace(item, config))
}

export function getNewWhitelistCandidates(items: string[], config: DevScriptsConfig): string[] {
  const whitelist = new Set(config.scan.whitelist || [])
  return Array.from(new Set(items.filter(item => !whitelist.has(item) && !isWhitelistedByNamespace(item, config)))).sort()
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
