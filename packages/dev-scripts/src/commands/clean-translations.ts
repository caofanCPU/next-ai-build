import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { getTranslationFilePath, loadTranslations } from '@dev-scripts/utils/file-scanner'
import { Logger } from '@dev-scripts/utils/logger'
import {
  cleanEmptyObjects,
  getAllKeys,
  pathOverlapsPrefix,
  removeKeyFromTranslations
} from '@dev-scripts/utils/translation-parser'
import { collectProjectTranslationUsage } from '@dev-scripts/utils/translation-usage'
import {
  filterWhitelistedItems,
  logWhitelistSuggestion
} from '@dev-scripts/utils/translation-whitelist'
import { writeFileSync } from 'fs'

export async function cleanTranslations(
  config: DevScriptsConfig, 
  shouldRemove: boolean = false,
  cwd: string = typeof process !== 'undefined' ? process.cwd() : '.'
): Promise<number> {
  const logger = new Logger(config)
  const logFileName = shouldRemove ? 'remove.log' : 'clean.log'
  
  logger.warn('==============================')
  logger.warn(`‼️  Current working directory: ⭕  ${cwd}  ⭕`)
  logger.warn('==============================')
  
  try {
    logger.log('start checking unused translation keys...')

    // load translation files
    const translations = loadTranslations(config, cwd)

    const usage = await collectProjectTranslationUsage(config, cwd, logger)
    const foundTranslationKeys = usage.usedKeys
    const foundNamespaces = usage.usedNamespaces
    const protectedPrefixes = usage.protectedPrefixes
    const wholeNamespaceProtection = usage.wholeNamespaceProtection

    logger.log(`\nfound ${foundTranslationKeys.size} used translation keys in the code`)
    logger.log(`found ${foundNamespaces.size} used namespaces in the code: ${Array.from(foundNamespaces).join(', ')}`)

    if (usage.hasUnknownNamespaceUsage) {
      logger.warn('detected unresolved namespace usage in some files, namespace-level cleanup will be skipped to avoid accidental deletion')
    }

    // check unused keys in each language file
    const unusedKeys: Record<string, string[]> = {}
    const removedKeys: Record<string, string[]> = {}
    const unusedNamespaces: Record<string, string[]> = {}

    config.i18n.locales.forEach(locale => {
      unusedKeys[locale] = []
      removedKeys[locale] = []
      unusedNamespaces[locale] = []

      // get all keys in the translation file
      const allTranslationKeys = getAllKeys(translations[locale])

      // get all namespaces (top-level keys) in the translation file
      const allNamespaces = Object.keys(translations[locale] || {})

      // find unused namespaces
      allNamespaces.forEach(namespace => {
        const isProtectedByPrefix = Array.from(protectedPrefixes).some(prefix => pathOverlapsPrefix(namespace, prefix))
        const isWholeNamespaceProtected = wholeNamespaceProtection.has(namespace)

        if (!usage.hasUnknownNamespaceUsage && !foundNamespaces.has(namespace) && !isProtectedByPrefix && !isWholeNamespaceProtected) {
          unusedNamespaces[locale].push(namespace)
        }
      })

      // find unused keys
      allTranslationKeys.forEach(key => {
        const isProtectedByPrefix = Array.from(protectedPrefixes).some(prefix => pathOverlapsPrefix(key, prefix))
        const namespace = key.split('.')[0] || ''
        const isWholeNamespaceProtected = wholeNamespaceProtection.has(namespace)

        if (!foundTranslationKeys.has(key) && !isProtectedByPrefix && !isWholeNamespaceProtected) {
          unusedKeys[locale].push(key)
        }
      })

      unusedNamespaces[locale] = filterWhitelistedItems(unusedNamespaces[locale], config)
      unusedKeys[locale] = filterWhitelistedItems(unusedKeys[locale], config)

      logger.log(`\nfound ${unusedKeys[locale].length} unused keys in the ${locale} translation file`)
      logger.log(`found ${unusedNamespaces[locale].length} unused namespaces in the ${locale} translation file`)
    })

    if (shouldRemove) {
      logger.log('\nstart deleting unused translation keys...')

      // delete unused keys in each language file
      config.i18n.locales.forEach(locale => {
        const translationsCopy = { ...translations[locale] }

        unusedKeys[locale].forEach(key => {
          if (removeKeyFromTranslations(key, translationsCopy)) {
            removedKeys[locale].push(key)
          }
        })

        // delete unused namespaces
        unusedNamespaces[locale].forEach(namespace => {
          if (translationsCopy[namespace] !== undefined) {
            delete translationsCopy[namespace]
            logger.log(`deleted unused namespace ${namespace} from the ${locale} translation file`)
          }
        })

        // clean empty objects
        const cleanedTranslations = cleanEmptyObjects(translationsCopy)

        // save updated translation file
        const filePath = getTranslationFilePath(locale, config, cwd)
        writeFileSync(filePath, JSON.stringify(cleanedTranslations, null, 2), 'utf8')

        logger.log(`deleted ${removedKeys[locale].length} unused keys from the ${locale} translation file`)
      })
    } else {
      logger.log('\nTo delete unused keys, please run the script with the --remove parameter')
    }

    // generate report
    logger.log('\n=== unused translation keys report ===\n')
    const unusedNamespaceSuggestions = new Set<string>()
    const unusedKeySuggestions = new Set<string>()

    config.i18n.locales.forEach(locale => {
      if (unusedNamespaces[locale].length > 0) {
        unusedNamespaces[locale].forEach(namespace => unusedNamespaceSuggestions.add(namespace))
        logger.log(`🔍 unused namespaces in the ${locale} translation file:`)
        unusedNamespaces[locale].forEach(namespace => logger.log(`  - ${namespace}`))
      } else {
        logger.success(`${locale} translation file has no unused namespaces`)
      }

      if (unusedKeys[locale].length > 0) {
        unusedKeys[locale].forEach(key => unusedKeySuggestions.add(key))
        logger.log(`\n🔍 unused keys in the ${locale} translation file:`)
        unusedKeys[locale].forEach(key => logger.log(`  - ${key}`))
      } else {
        logger.success(`${locale} translation file has no unused keys`)
      }

      if (shouldRemove && removedKeys[locale].length > 0) {
        logger.log(`\n🗑️ deleted keys from the ${locale} translation file:`)
        removedKeys[locale].forEach(key => logger.log(`  - ${key}`))
      }
    })

    logger.log('\n=== report end ===\n')
    logger.log('⚠️ script uses AST analysis; dynamic namespace and dynamic key cases are treated conservatively to avoid accidental deletion')

    logWhitelistSuggestion(
      [
        ...Array.from(unusedNamespaceSuggestions),
        ...Array.from(unusedKeySuggestions)
      ],
      logger,
      config
    )

    const hasIssues = Object.values(unusedKeys).some(keys => keys.length > 0) ||
      Object.values(unusedNamespaces).some(namespaces => namespaces.length > 0)

    if (hasIssues) {
      logger.warn('unused translation items were found; the script completed successfully, see the report above or the log file for details')
    } else {
      logger.success('translation cleanup scan completed with no issues')
    }

    // save log file
    logger.saveToFile(logFileName, cwd)

    return 0

  } catch (error) {
    logger.error(`error cleaning translations: ${error}`)
    return 1
  }
} 
