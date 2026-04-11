import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { loadTranslations } from '@dev-scripts/utils/file-scanner'
import { 
  getAllKeys, 
  checkKeyExists, 
  checkNamespaceExists,
  pathOverlapsPrefix
} from '@dev-scripts/utils/translation-parser'
import { collectProjectTranslationUsage } from '@dev-scripts/utils/translation-usage'
import {
  filterWhitelistedItems,
  logWhitelistSuggestion
} from '@dev-scripts/utils/translation-whitelist'

interface TranslationReport {
  [key: string]: string[]
}

function getKeysForNamespace(namespace: string, keys: Set<string>): string[] {
  if (!namespace) {
    return Array.from(keys)
  }

  return Array.from(keys).filter(key => key === namespace || key.startsWith(`${namespace}.`))
}

function isNamespaceUsed(namespace: string, usedNamespaces: Set<string>): boolean {
  return Array.from(usedNamespaces).some(
    usedNamespace => usedNamespace === namespace || usedNamespace.startsWith(`${namespace}.`)
  )
}

function isProtectedByWholeNamespace(path: string, protectedNamespaces: Set<string>): boolean {
  return Array.from(protectedNamespaces).some(
    namespace => path === namespace || path.startsWith(`${namespace}.`)
  )
}

function isCoveredByUsedKey(path: string, usedKeys: Set<string>): boolean {
  return Array.from(usedKeys).some(
    usedKey => path === usedKey || path.startsWith(`${usedKey}.`)
  )
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
    const protectedPrefixes = usage.protectedPrefixes
    const wholeNamespaceProtection = usage.wholeNamespaceProtection

    if (usage.hasAmbiguousNamespaceBindings) {
      logger.error('detected translator variables that map to multiple namespaces within the same file; the resulting key analysis would be unreliable, so the check is aborted')
      usage.ambiguousNamespaceBindings.forEach((varNames, filePath) => {
        logger.error(`  file: ${filePath}`)
        Array.from(varNames).sort().forEach(varName => {
          logger.error(`    - ${varName}`)
        })
      })
      logger.saveToFile('check.log', cwd)
      return 1
    }

    logger.log(`\nfound ${foundNamespaces.size} used namespaces in the code: ${Array.from(foundNamespaces).join(', ')}`)
    logger.log(`found ${foundTranslationKeys.size} used translation keys in the code`)

    if (usage.hasUnknownNamespaceUsage) {
      logger.warn('detected unresolved namespace usage in some files, so missing and unused checks may be incomplete for those dynamic cases')
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
      const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
      const missingKey = `missingIn${locale.toUpperCase()}`
      report[missingNamespaceKey] = filterWhitelistedItems(report[missingNamespaceKey] || [], config)
      report[missingKey] = filterWhitelistedItems(report[missingKey] || [], config)
    })

    config.i18n.locales.forEach(locale => {
      const missingNamespaceKey = `missingNamespacesIn${locale.toUpperCase()}`
      const missingKey = `missingIn${locale.toUpperCase()}`
      const remainingMissingKeys = new Set(report[missingKey] || [])

      report[missingNamespaceKey] = (report[missingNamespaceKey] || []).filter(namespace => {
        const namespaceKeys = getKeysForNamespace(namespace, foundTranslationKeys)
        if (namespaceKeys.length === 0) {
          return true
        }

        return namespaceKeys.some(key => remainingMissingKeys.has(key))
      })
    })

    // check if there are unused namespaces and keys
    config.i18n.locales.forEach(locale => {
      const allTranslationKeys = getAllKeys(translations[locale])
      const allNamespaces = Object.keys(translations[locale] || {})
      const unusedNamespaceKey = `unusedNamespacesIn${locale.toUpperCase()}`
      const unusedKey = `unusedIn${locale.toUpperCase()}`

      report[unusedNamespaceKey] = []
      report[unusedKey] = []

      if (!usage.hasUnknownNamespaceUsage) {
        allNamespaces.forEach(namespace => {
          const isProtectedByPrefix = Array.from(protectedPrefixes).some(prefix => pathOverlapsPrefix(namespace, prefix))
          const isWholeNamespaceProtected = isProtectedByWholeNamespace(namespace, wholeNamespaceProtection)

          if (!isNamespaceUsed(namespace, foundNamespaces) && !isProtectedByPrefix && !isWholeNamespaceProtected) {
            report[unusedNamespaceKey].push(namespace)
          }
        })
      }

      allTranslationKeys.forEach(key => {
        const isProtectedByPrefix = Array.from(protectedPrefixes).some(prefix => pathOverlapsPrefix(key, prefix))
        const isWholeNamespaceProtected = isProtectedByWholeNamespace(key, wholeNamespaceProtection)
        const isCoveredByUsedParentKey = isCoveredByUsedKey(key, foundTranslationKeys)

        if (!foundTranslationKeys.has(key) && !isCoveredByUsedParentKey && !isProtectedByPrefix && !isWholeNamespaceProtected) {
          report[unusedKey].push(key)
        }
      })

      report[unusedNamespaceKey] = filterWhitelistedItems(report[unusedNamespaceKey], config)
      report[unusedKey] = filterWhitelistedItems(report[unusedKey], config)
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
    const unusedKeySuggestions = new Set<string>()
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

    // then report unused namespaces and keys
    config.i18n.locales.forEach(locale => {
      const unusedNamespaceKey = `unusedNamespacesIn${locale.toUpperCase()}`
      if (report[unusedNamespaceKey]?.length > 0) {
        logger.log(`\n🔍 unused namespaces in the ${locale} translation file:`)
        report[unusedNamespaceKey].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} translation file has no unused namespaces`)
      }
    })

    config.i18n.locales.forEach(locale => {
      const unusedKey = `unusedIn${locale.toUpperCase()}`
      if (report[unusedKey]?.length > 0) {
        report[unusedKey].forEach(key => unusedKeySuggestions.add(key))
        logger.log(`\n🔍 unused keys in the ${locale} translation file:`)
        report[unusedKey].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} translation file has no unused keys`)
      }
    })

    // finally report inconsistent keys across locales
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
        ...Array.from(unusedKeySuggestions),
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
