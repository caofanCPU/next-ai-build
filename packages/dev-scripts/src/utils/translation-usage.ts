import {
  CallExpression,
  Expression,
  NoSubstitutionTemplateLiteral,
  Node,
  ObjectLiteralExpression,
  Project,
  SourceFile,
  SyntaxKind,
  TemplateExpression,
  VariableDeclaration,
} from 'ts-morph'
import { DevScriptsConfig } from '@dev-scripts/config/schema'
import { Logger } from '@dev-scripts/utils/logger'
import { scanFiles } from '@dev-scripts/utils/file-scanner'

const project = new Project({
  useInMemoryFileSystem: true,
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    allowJs: true,
  },
})

interface StringResolution {
  dynamic: boolean
  values: Set<string>
}

interface TranslatorBinding {
  dynamic: boolean
  namespaces: Set<string>
}

export interface FileTranslationUsage {
  filePath: string
  keys: string[]
  namespaceMappings: Map<string, string[]>
  protectedPrefixes: string[]
  unknownNamespaceVars: string[]
  wholeNamespaceProtection: string[]
}

export interface ProjectTranslationUsage {
  usedKeys: Set<string>
  usedNamespaces: Set<string>
  protectedPrefixes: Set<string>
  namespaceMappings: Map<string, Set<string>>
  unknownNamespaceVars: Map<string, Set<string>>
  wholeNamespaceProtection: Set<string>
  files: FileTranslationUsage[]
  hasUnknownNamespaceUsage: boolean
}

interface SourceAnalysisContext {
  assignments: Map<string, Expression[]>
  declarations: Map<string, VariableDeclaration[]>
}

interface KeyUsage {
  exactKeys: string[]
  protectWholeNamespace: boolean
  protectedPrefixes: string[]
}

function createSourceAnalysisContext(sourceFile: SourceFile): SourceAnalysisContext {
  const declarations = new Map<string, VariableDeclaration[]>()
  const assignments = new Map<string, Expression[]>()

  sourceFile.forEachDescendant((node: Node) => {
    if (Node.isVariableDeclaration(node) && Node.isIdentifier(node.getNameNode())) {
      const name = node.getName()
      const list = declarations.get(name) || []
      list.push(node)
      declarations.set(name, list)
    }

    if (Node.isBinaryExpression(node) && node.getOperatorToken().getKind() === SyntaxKind.EqualsToken) {
      const left = node.getLeft()
      if (Node.isIdentifier(left)) {
        const list = assignments.get(left.getText()) || []
        list.push(node.getRight())
        assignments.set(left.getText(), list)
      }
    }
  })

  return {
    assignments,
    declarations,
  }
}

function getCallExpressionName(callExpression: CallExpression): string | undefined {
  const expression = callExpression.getExpression()
  if (Node.isIdentifier(expression)) {
    return expression.getText()
  }
  return undefined
}

function unwrapExpression(expression: Expression): Expression {
  let current = expression

  while (Node.isAwaitExpression(current) || Node.isParenthesizedExpression(current) || Node.isAsExpression(current) || Node.isTypeAssertion(current) || Node.isNonNullExpression(current) || Node.isSatisfiesExpression(current)) {
    if (Node.isAwaitExpression(current)) {
      current = current.getExpression()
      continue
    }

    if (Node.isParenthesizedExpression(current)) {
      current = current.getExpression()
      continue
    }

    if (Node.isAsExpression(current) || Node.isTypeAssertion(current) || Node.isNonNullExpression(current) || Node.isSatisfiesExpression(current)) {
      current = current.getExpression()
      continue
    }
  }

  return current
}

function findLatestExpression(name: string, beforePos: number, context: SourceAnalysisContext): Expression | undefined {
  const candidates: Array<{ pos: number; expression: Expression }> = []

  for (const declaration of context.declarations.get(name) || []) {
    const initializer = declaration.getInitializer()
    if (!initializer || declaration.getStart() >= beforePos) {
      continue
    }
    candidates.push({ pos: declaration.getStart(), expression: initializer })
  }

  for (const assignment of context.assignments.get(name) || []) {
    if (assignment.getStart() >= beforePos) {
      continue
    }
    candidates.push({ pos: assignment.getStart(), expression: assignment })
  }

  candidates.sort((a, b) => b.pos - a.pos)
  return candidates[0]?.expression
}

function resolveStringValues(
  expression: Expression | undefined,
  context: SourceAnalysisContext,
  beforePos: number,
  seen: Set<string> = new Set()
): StringResolution {
  if (!expression) {
    return { dynamic: true, values: new Set() }
  }

  const current = unwrapExpression(expression)

  if (Node.isStringLiteral(current) || Node.isNoSubstitutionTemplateLiteral(current)) {
    return { dynamic: false, values: new Set([current.getLiteralText()]) }
  }

  if (Node.isConditionalExpression(current)) {
    const whenTrue = resolveStringValues(current.getWhenTrue(), context, beforePos, seen)
    const whenFalse = resolveStringValues(current.getWhenFalse(), context, beforePos, seen)
    return {
      dynamic: whenTrue.dynamic || whenFalse.dynamic,
      values: new Set([...whenTrue.values, ...whenFalse.values]),
    }
  }

  if (Node.isBinaryExpression(current) && current.getOperatorToken().getKind() === SyntaxKind.PlusToken) {
    const left = resolveStringValues(current.getLeft(), context, beforePos, seen)
    const right = resolveStringValues(current.getRight(), context, beforePos, seen)
    const values = new Set<string>()

    if (left.values.size > 0 && right.values.size > 0) {
      left.values.forEach(leftValue => {
        right.values.forEach(rightValue => {
          values.add(`${leftValue}${rightValue}`)
        })
      })
    }

    return {
      dynamic: left.dynamic || right.dynamic || values.size === 0,
      values,
    }
  }

  if (Node.isTemplateExpression(current)) {
    let values = new Set<string>([current.getHead().getLiteralText()])
    let dynamic = false

    current.getTemplateSpans().forEach((span: Node) => {
      if (!Node.isTemplateSpan(span)) {
        return
      }

      const resolvedExpression = resolveStringValues(span.getExpression(), context, beforePos, seen)
      const spanValues = resolvedExpression.values
      const suffix = span.getLiteral().getLiteralText()
      const nextValues = new Set<string>()

      if (spanValues.size === 0) {
        dynamic = true
        return
      }

      values.forEach(existing => {
        spanValues.forEach(value => {
          nextValues.add(`${existing}${value}${suffix}`)
        })
      })

      values = nextValues
      dynamic = dynamic || resolvedExpression.dynamic
    })

    return {
      dynamic,
      values,
    }
  }

  if (Node.isIdentifier(current)) {
    const key = `${current.getText()}:${beforePos}`
    if (seen.has(key)) {
      return { dynamic: true, values: new Set() }
    }

    seen.add(key)
    const latestExpression = findLatestExpression(current.getText(), beforePos, context)
    return resolveStringValues(latestExpression, context, beforePos, seen)
  }

  return { dynamic: true, values: new Set() }
}

function extractTemplatePrefix(expression: TemplateExpression | NoSubstitutionTemplateLiteral): string | undefined {
  if (Node.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.getLiteralText() || undefined
  }

  const head = expression.getHead().getLiteralText()
  const prefix = head.endsWith('.') ? head.slice(0, -1) : head
  return prefix || undefined
}

function normalizeKey(key: string): string | undefined {
  const trimmed = key.trim().replace(/\.+/g, '.').replace(/^\./, '').replace(/\.$/, '')
  if (trimmed === '' || trimmed.includes('/')) {
    return undefined
  }
  return trimmed
}

function joinNamespaceAndKey(namespace: string, key: string): string {
  return namespace ? `${namespace}.${key}` : key
}

function extractKeyUsage(
  expression: Expression | undefined,
  context: SourceAnalysisContext,
  beforePos: number
): KeyUsage {
  if (!expression) {
    return {
      exactKeys: [],
      protectWholeNamespace: true,
      protectedPrefixes: [],
    }
  }

  const current = unwrapExpression(expression)
  const resolved = resolveStringValues(current, context, beforePos)
  const exactKeys = Array.from(resolved.values)
    .map(normalizeKey)
    .filter((key): key is string => Boolean(key))

  const protectedPrefixes: string[] = []

  if (Node.isTemplateExpression(current) || Node.isNoSubstitutionTemplateLiteral(current)) {
    const prefix = extractTemplatePrefix(current)
    if (prefix) {
      const normalized = normalizeKey(prefix)
      if (normalized) {
        protectedPrefixes.push(normalized)
      }
    }
  }

  return {
    exactKeys,
    protectWholeNamespace: resolved.dynamic && exactKeys.length === 0 && protectedPrefixes.length === 0,
    protectedPrefixes,
  }
}

function extractNamespaceFromObjectLiteral(
  objectLiteral: ObjectLiteralExpression,
  context: SourceAnalysisContext,
  beforePos: number
): StringResolution {
  const namespaceProperty = objectLiteral.getProperties().find((property: Node) => {
    if (Node.isPropertyAssignment(property)) {
      return property.getName() === 'namespace'
    }
    if (Node.isShorthandPropertyAssignment(property)) {
      return property.getName() === 'namespace'
    }
    return false
  })

  if (!namespaceProperty) {
    return { dynamic: false, values: new Set(['']) }
  }

  if (Node.isPropertyAssignment(namespaceProperty)) {
    return resolveStringValues(namespaceProperty.getInitializer(), context, beforePos)
  }

  if (Node.isShorthandPropertyAssignment(namespaceProperty)) {
    const identifier = namespaceProperty.getNameNode()
    if (Node.isIdentifier(identifier)) {
      return resolveStringValues(identifier, context, beforePos)
    }
  }

  return { dynamic: true, values: new Set() }
}

function resolveTranslatorNamespaces(
  callExpression: CallExpression,
  context: SourceAnalysisContext,
  beforePos: number
): StringResolution | undefined {
  const callName = getCallExpressionName(callExpression)

  if (callName === 'useTranslations') {
    const namespaceArg = callExpression.getArguments()[0]
    if (!namespaceArg) {
      return { dynamic: false, values: new Set(['']) }
    }
    return resolveStringValues(namespaceArg as Expression, context, beforePos)
  }

  if (callName === 'getTranslations') {
    const namespaceArg = callExpression.getArguments()[0]
    if (!namespaceArg) {
      return { dynamic: false, values: new Set(['']) }
    }

    const current = unwrapExpression(namespaceArg as Expression)
    if (Node.isObjectLiteralExpression(current)) {
      return extractNamespaceFromObjectLiteral(current, context, beforePos)
    }

    return resolveStringValues(current, context, beforePos)
  }

  return undefined
}

function registerTranslatorBinding(
  name: string,
  namespaces: StringResolution | undefined,
  bindings: Map<string, TranslatorBinding>
): void {
  if (!namespaces) {
    return
  }

  const existing = bindings.get(name) || {
    dynamic: false,
    namespaces: new Set<string>(),
  }

  existing.dynamic = existing.dynamic || namespaces.dynamic
  namespaces.values.forEach(namespace => existing.namespaces.add(namespace))
  bindings.set(name, existing)
}

function collectTranslatorBindings(sourceFile: SourceFile, context: SourceAnalysisContext): Map<string, TranslatorBinding> {
  const bindings = new Map<string, TranslatorBinding>()

  sourceFile.forEachDescendant((node: Node) => {
    if (!Node.isVariableDeclaration(node)) {
      return
    }

    const initializer = node.getInitializer()
    if (!initializer) {
      return
    }

    const current = unwrapExpression(initializer)

    if (Node.isAwaitExpression(initializer) && Node.isCallExpression(current)) {
      const expression = current.getExpression()
      if (Node.isPropertyAccessExpression(expression) && expression.getName() === 'all' && expression.getExpression().getText() === 'Promise') {
        const firstArg = current.getArguments()[0]
        const nameNode = node.getNameNode()

        if (firstArg && Node.isArrayLiteralExpression(firstArg) && Node.isArrayBindingPattern(nameNode)) {
          const elements = firstArg.getElements()
          const names = nameNode.getElements()

          names.forEach((bindingElement: Node, index: number) => {
            if (!Node.isBindingElement(bindingElement)) {
              return
            }

            const bindingName = bindingElement.getNameNode()
            const element = elements[index]

            if (!Node.isIdentifier(bindingName) || !element || !Node.isCallExpression(element)) {
              return
            }

            const namespaces = resolveTranslatorNamespaces(element, context, node.getStart())
            registerTranslatorBinding(bindingName.getText(), namespaces, bindings)
          })
          return
        }
      }
    }

    if (Node.isCallExpression(current)) {
      const namespaces = resolveTranslatorNamespaces(current, context, node.getStart())
      if (Node.isIdentifier(node.getNameNode())) {
        registerTranslatorBinding(node.getName(), namespaces, bindings)
      }
    }
  })

  return bindings
}

function getTranslatorBindingFromExpression(
  expression: Expression,
  bindings: Map<string, TranslatorBinding>
): { binding: TranslatorBinding; varName: string } | undefined {
  const current = unwrapExpression(expression)
  if (!Node.isIdentifier(current)) {
    return undefined
  }

  const binding = bindings.get(current.getText())
  if (!binding) {
    return undefined
  }

  return {
    binding,
    varName: current.getText(),
  }
}

function addUsageForNamespaces(
  namespaces: Set<string>,
  keyUsage: KeyUsage,
  exactKeys: Set<string>,
  protectedPrefixes: Set<string>,
  wholeNamespaceProtection: Set<string>
): void {
  namespaces.forEach(namespace => {
    if (keyUsage.protectWholeNamespace) {
      wholeNamespaceProtection.add(namespace)
    }

    keyUsage.exactKeys.forEach(key => {
      exactKeys.add(joinNamespaceAndKey(namespace, key))
    })

    keyUsage.protectedPrefixes.forEach(prefix => {
      protectedPrefixes.add(joinNamespaceAndKey(namespace, prefix))
    })
  })
}

export function analyzeTranslationUsage(content: string, filePath: string): FileTranslationUsage {
  const sourceFile = project.createSourceFile(filePath, content, { overwrite: true })
  const context = createSourceAnalysisContext(sourceFile)
  const bindings = collectTranslatorBindings(sourceFile, context)
  const exactKeys = new Set<string>()
  const protectedPrefixes = new Set<string>()
  const wholeNamespaceProtection = new Set<string>()
  const unknownNamespaceVars = new Set<string>()

  sourceFile.forEachDescendant((node: Node) => {
    if (!Node.isCallExpression(node)) {
      return
    }

    const expression = node.getExpression()

    if (Node.isIdentifier(expression)) {
      const translatorCall = getTranslatorBindingFromExpression(expression, bindings)
      if (translatorCall) {
        const keyUsage = extractKeyUsage(node.getArguments()[0] as Expression | undefined, context, node.getStart())
        addUsageForNamespaces(translatorCall.binding.namespaces, keyUsage, exactKeys, protectedPrefixes, wholeNamespaceProtection)
        if (translatorCall.binding.dynamic) {
          unknownNamespaceVars.add(translatorCall.varName)
        }
        return
      }

      const firstArg = node.getArguments()[0]
      const secondArg = node.getArguments()[1]
      if (!firstArg || !secondArg) {
        return
      }

      const wrappedTranslator = getTranslatorBindingFromExpression(firstArg as Expression, bindings)
      if (!wrappedTranslator) {
        return
      }

      const keyUsage = extractKeyUsage(secondArg as Expression, context, node.getStart())
      addUsageForNamespaces(wrappedTranslator.binding.namespaces, keyUsage, exactKeys, protectedPrefixes, wholeNamespaceProtection)
      if (wrappedTranslator.binding.dynamic) {
        unknownNamespaceVars.add(wrappedTranslator.varName)
      }
      return
    }

    if (!Node.isPropertyAccessExpression(expression)) {
      return
    }

    const objectCall = getTranslatorBindingFromExpression(expression.getExpression(), bindings)
    if (!objectCall) {
      return
    }

    const keyUsage = extractKeyUsage(node.getArguments()[0] as Expression | undefined, context, node.getStart())
    addUsageForNamespaces(objectCall.binding.namespaces, keyUsage, exactKeys, protectedPrefixes, wholeNamespaceProtection)

    if (objectCall.binding.dynamic) {
      unknownNamespaceVars.add(objectCall.varName)
    }
  })

  const namespaceMappings = new Map<string, string[]>()
  bindings.forEach((binding, name) => {
    const values = Array.from(binding.namespaces)
    if (binding.dynamic && values.length === 0) {
      namespaceMappings.set(name, ['<dynamic>'])
      return
    }

    if (binding.dynamic) {
      namespaceMappings.set(name, [...values, '<dynamic>'])
      return
    }

    namespaceMappings.set(name, values)
  })

  sourceFile.forget()

  return {
    filePath,
    keys: Array.from(exactKeys).sort(),
    namespaceMappings,
    protectedPrefixes: Array.from(protectedPrefixes).sort(),
    unknownNamespaceVars: Array.from(unknownNamespaceVars).sort(),
    wholeNamespaceProtection: Array.from(wholeNamespaceProtection).sort(),
  }
}

function getNamespaceFromPath(path: string): string | undefined {
  if (!path) {
    return undefined
  }

  const [namespace] = path.split('.')
  return namespace || undefined
}

export async function collectProjectTranslationUsage(
  config: DevScriptsConfig,
  cwd: string,
  logger: Logger
): Promise<ProjectTranslationUsage> {
  const scanResults = await scanFiles(config, cwd)
  logger.log(`found ${scanResults.length} files to scan`)

  const usedKeys = new Set<string>()
  const usedNamespaces = new Set<string>()
  const protectedPrefixes = new Set<string>()
  const namespaceMappings = new Map<string, Set<string>>()
  const unknownNamespaceVars = new Map<string, Set<string>>()
  const wholeNamespaceProtection = new Set<string>()
  const files: FileTranslationUsage[] = []

  for (const { filePath, content } of scanResults) {
    try {
      const usage = analyzeTranslationUsage(content, filePath)
      files.push(usage)

      if (
        usage.keys.length > 0 ||
        usage.namespaceMappings.size > 0 ||
        usage.protectedPrefixes.length > 0 ||
        usage.wholeNamespaceProtection.length > 0 ||
        usage.unknownNamespaceVars.length > 0
      ) {
        logger.log(`found the following information in the file ${filePath}:`)

        if (usage.namespaceMappings.size > 0) {
          logger.log('  translation function mapping:')
          usage.namespaceMappings.forEach((namespaces, varName) => {
            logger.log(`    - ${varName} => ${namespaces.join(' | ')}`)

            const bucket = namespaceMappings.get(varName) || new Set<string>()
            namespaces.forEach(namespace => {
              if (namespace !== '<dynamic>') {
                bucket.add(namespace)
                if (namespace !== '') {
                  usedNamespaces.add(namespace)
                }
              }
            })
            namespaceMappings.set(varName, bucket)
          })
        }

        if (usage.keys.length > 0) {
          logger.log('  translation keys:')
          usage.keys.forEach(key => {
            logger.log(`    - ${key}`)
            usedKeys.add(key)
            const namespace = getNamespaceFromPath(key)
            if (namespace) {
              usedNamespaces.add(namespace)
            }
          })
        }

        if (usage.protectedPrefixes.length > 0) {
          logger.log('  protected prefixes:')
          usage.protectedPrefixes.forEach(prefix => {
            logger.log(`    - ${prefix}`)
            protectedPrefixes.add(prefix)
            const namespace = getNamespaceFromPath(prefix)
            if (namespace) {
              usedNamespaces.add(namespace)
            }
          })
        }

        if (usage.wholeNamespaceProtection.length > 0) {
          logger.log('  dynamic key namespaces:')
          usage.wholeNamespaceProtection.forEach(namespace => {
            logger.log(`    - ${namespace || '<root>'}`)
            wholeNamespaceProtection.add(namespace)
            if (namespace !== '') {
              usedNamespaces.add(namespace)
            }
          })
        }

        if (usage.unknownNamespaceVars.length > 0) {
          logger.warn('  unresolved namespace variables:')
          usage.unknownNamespaceVars.forEach(varName => {
            logger.warn(`    - ${varName}`)
            const bucket = unknownNamespaceVars.get(filePath) || new Set<string>()
            bucket.add(varName)
            unknownNamespaceVars.set(filePath, bucket)
          })
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`error processing file ${filePath}: ${error.message}`)
      } else {
        logger.error(`error processing file ${filePath}: unknown error`)
      }
    }
  }

  return {
    usedKeys,
    usedNamespaces,
    protectedPrefixes,
    namespaceMappings,
    unknownNamespaceVars,
    wholeNamespaceProtection,
    files,
    hasUnknownNamespaceUsage: unknownNamespaceVars.size > 0,
  }
}
