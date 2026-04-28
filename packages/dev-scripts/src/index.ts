// commands
export { checkTranslations } from '@dev-scripts/commands/check-translations'
export { generateBlogIndex } from '@dev-scripts/commands/generate-blog-index'
export { diaomaoUpdate } from '@dev-scripts/commands/diaomao-update'
export {
  registerBackendCoreCommands,
  syncBackendCoreRoutes,
  listBackendCoreRoutes
} from '@dev-scripts/commands/backend-core'

// config
export { loadConfig, validateConfig } from '@dev-scripts/config'
export type { DevScriptsConfig, PackageJsonDevScripts } from '@dev-scripts/config/schema'
