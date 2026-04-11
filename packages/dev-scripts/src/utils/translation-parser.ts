function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getValueAtPath(path: string, translations: Record<string, any>): any {
  if (!path) {
    return translations
  }

  const parts = path.split('.')
  let current: any = translations

  for (const part of parts) {
    if (current === undefined || current === null || current[part] === undefined) {
      return undefined
    }
    current = current[part]
  }

  return current
}

/**
 * get all leaf keys from an object (including nested keys)
 */
export function getAllKeys(obj: Record<string, any>, prefix: string = ''): string[] {
  let keys: string[] = []

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue
    }

    const newKey = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(obj[key]) || Array.isArray(obj[key])) {
      keys = [...keys, ...getAllKeys(obj[key], newKey)]
      continue
    }

    keys.push(newKey)
  }

  return keys
}

/**
 * check if the key exists in the translation file
 */
export function checkKeyExists(key: string, translations: Record<string, any>): boolean {
  if (!key) {
    return false
  }

  return getValueAtPath(key, translations) !== undefined
}

/**
 * check if the namespace exists in the translation file
 */
export function checkNamespaceExists(namespace: string, translations: Record<string, any>): boolean {
  if (namespace === '') {
    return true
  }

  return getValueAtPath(namespace, translations) !== undefined
}

/**
 * whether a key path overlaps a protected prefix
 */
export function pathOverlapsPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || prefix.startsWith(`${path}.`)
}

/**
 * remove the specified key from the translation object
 */
export function removeKeyFromTranslations(key: string, translations: Record<string, any>): boolean {
  const parts = key.split('.')
  const lastPart = parts.pop()

  if (!lastPart) return false

  let current = translations

  for (const part of parts) {
    if (current[part] === undefined || typeof current[part] !== 'object' || current[part] === null) {
      return false
    }
    current = current[part]
  }

  if (current[lastPart] !== undefined) {
    delete current[lastPart]
    return true
  }

  return false
}

/**
 * clean empty objects (recursively)
 */
export function cleanEmptyObjects(obj: Record<string, any>): Record<string, any> {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue
    }

    if (isPlainObject(obj[key])) {
      obj[key] = cleanEmptyObjects(obj[key])
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key]
      }
      continue
    }

    if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map(item => (isPlainObject(item) ? cleanEmptyObjects(item) : item))
    }
  }

  return obj
}
