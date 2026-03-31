import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { loadTranslations } from '@dev-scripts/utils/file-scanner'
import { 
  getAllKeys, 
  checkKeyExists, 
  checkNamespaceExists 
} from '@dev-scripts/utils/translation-parser'
import { collectProjectTranslationUsage } from '@dev-scripts/utils/translation-usage'
import {
  filterWhitelistedItems,
  logWhitelistSuggestion
} from '@dev-scripts/utils/translation-whitelist'

interface TranslationReport {
  [key: string]: string[]
}

function groupKeysByNamespace(keys: Set<string>): Map<string, string[]> {
  const grouped = new Map<string, string[]>()
  keys.forEach(key => {
    const [namespace] = key.split('.')
    if (!namespace) {
      return
    }
    const list = grouped.get(namespace) || []
    list.push(key)
    grouped.set(namespace, list)
  })
  return grouped
}

export async function checkTranslations(config: DevScriptsConfig, cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'): Promise<number> {
  const logger = new Logger(config)
  logger.warn('==============================')
  logger.warn(`‼️  Current working directory: ⭕  ${cwd}  ⭕`)
  logger.warn('==============================')
  
  try {
    logger.log('start checking translations...')

    // load translation files
    const translations = loadTranslations(config, cwd)

    const usage = await collectProjectTranslationUsage(config, cwd, logger)
    const foundTranslationKeys = usage.usedKeys
    const foundNamespaces = usage.usedNamespaces
    const usedKeysByNamespace = groupKeysByNamespace(foundTranslationKeys)

    logger.log(`\nfound ${foundNamespaces.size} used namespaces in the code: ${Array.from(foundNamespaces).join(', ')}`)
    logger.log(`found ${foundTranslationKeys.size} used translation keys in the code`)

    if (usage.hasUnknownNamespaceUsage) {
      logger.warn('detected unresolved namespace usage in some files, so missing-key checks may be incomplete for those dynamic cases')
    }

    // check results
    const report: TranslationReport = {}

    // check if the namespace exists
    foundNamespaces.forEach(namespace => {
      config.i18n.locales.forEach(locale => {
        const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
        if (!checkNamespaceExists(namespace, translations[locale])) {
          report[missingNamespaceKey] = report[missingNamespaceKey] || []
          report[missingNamespaceKey].push(namespace)
        }
      })
    })
    // check if the translation key exists
    foundTranslationKeys.forEach(key => {
      config.i18n.locales.forEach(locale => {
        const missingKey = `missingIn${locale.toUpperCase()}`
        if (!checkKeyExists(key, translations[locale])) {
          report[missingKey] = report[missingKey] || []
          report[missingKey].push(key)
        }
      })
    })
    config.i18n.locales.forEach(locale => {
      const missingKey = `missingIn${locale.toUpperCase()}`
      report[missingKey] = filterWhitelistedItems(report[missingKey] || [], config)
    })

    config.i18n.locales.forEach(locale => {
      const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
      const missingKey = `missingIn${locale.toUpperCase()}`
      const remainingMissingKeys = new Set(report[missingKey] || [])

      report[missingNamespaceKey] = (report[missingNamespaceKey] || []).filter(namespace => {
        const namespaceKeys = usedKeysByNamespace.get(namespace) || []
        if (namespaceKeys.length === 0) {
          return true
        }

        return namespaceKeys.some(key => remainingMissingKeys.has(key))
      })
    })

    // check if the translation keys are consistent
    config.i18n.locales.forEach(locale => {
      const allKeys = getAllKeys(translations[locale])
      const missingComparedWithOthers = new Set<string>()

      config.i18n.locales.forEach(otherLocale => {
        if (locale !== otherLocale) {
          const otherKeys = getAllKeys(translations[otherLocale])
          allKeys
            .filter(key => !otherKeys.includes(key))
            .forEach(key => missingComparedWithOthers.add(key))
        }
      })

      const onlyKeys = `${locale}OnlyKeys`
      report[onlyKeys] = filterWhitelistedItems(Array.from(missingComparedWithOthers), config)
    })

    // generate report
    logger.log('\n=== translation check report ===\n')
    const missingKeySuggestions = new Set<string>()
    const inconsistentKeySuggestions = new Set<string>()

    // first report missing namespaces, which is usually the most serious problem
    config.i18n.locales.forEach(locale => {
      const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
      if (report[missingNamespaceKey]?.length > 0) {
        logger.log(`🚨 missing namespaces in the ${locale} translation file:`)
        report[missingNamespaceKey].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} translation file has all used namespaces`)
      }
    })

    // then report missing translation keys
    config.i18n.locales.forEach(locale => {
      const missingKey = `missingIn${locale.toUpperCase()}`
      if (report[missingKey]?.length > 0) {
        report[missingKey].forEach(key => missingKeySuggestions.add(key))
        logger.log(`\n🔴 missing keys in the ${locale} translation file:`)
        report[missingKey].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} translation file has all used keys`)
      }
    })

    // finally report inconsistent keys
    config.i18n.locales.forEach(locale => {
      const onlyKeys = `${locale}OnlyKeys`
      if (report[onlyKeys]?.length > 0) {
        report[onlyKeys].forEach(key => inconsistentKeySuggestions.add(key))
        logger.log(`\n⚠️ keys only exist in the ${locale} translation file:`)
        report[onlyKeys].forEach(key => logger.log(`  - ${key}`))
      }
    })

    logger.log('\n=== report end ===\n')
    logger.log('⚠️ script uses AST analysis; dynamic namespace and dynamic key cases are treated conservatively and may require manual review')

    logWhitelistSuggestion(
      [
        ...Array.from(missingKeySuggestions),
        ...Array.from(inconsistentKeySuggestions)
      ],
      logger,
      config
    )

    const hasProblems = Object.values(report).some(keys => keys.length > 0)
    if (hasProblems) {
      logger.warn('translation issues were found; the script completed successfully, see the report above or the log file for details')
    } else {
      logger.success('translation check completed with no issues')
    }

    // save log file
    logger.saveToFile('check.log', cwd)

    return 0

  } catch (error) {  
    logger.error(`error checking translations: ${error}`)
    return 1
  }
} 
