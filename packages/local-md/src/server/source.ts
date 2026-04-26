import type { StandardSchemaV1 } from '@standard-schema/spec';
import { loader } from 'fumadocs-core/source';
import { getLocalMdDurationMs, getLocalMdNow, logLocalMdDebug, logLocalMdWarn } from '../debug';
import type {
  ConfiguredLocalMdSourceFactoryOptions,
  CreateLocalMdSourceLoaderOptions,
} from './source-shared';
import {
  countLocalePages,
  countLocaleTreeChildren,
  countSourceFiles,
  isLoaderResultEmpty,
  isLocalMdCacheDisabled,
  resolveBaseUrl,
  resolveSourceDir,
  shouldCacheEmptySource,
} from './source-shared';

type LocalMdLoaderResult = Awaited<ReturnType<typeof createLocalMdSourceLoader>>;
type LocalMdLoaderPromise = Promise<LocalMdLoaderResult>;

function resolveSourceMode(mode: CreateLocalMdSourceLoaderOptions['mode']) {
  if (mode && mode !== 'auto') return mode;
  return process.env.NODE_ENV === 'production' ? 'build' : 'runtime';
}

export async function createLocalMdSourceLoader<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  options: CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>,
) {
  const startedAt = getLocalMdNow();
  const {
    sourceKey = 'docs',
    dir,
    baseUrl,
    sourceRootDir,
    i18n,
    icon,
    mode,
    appRoot,
    ...localMdConfig
  } = options;

  const resolvedDir = resolveSourceDir(sourceKey, dir, sourceRootDir);
  const resolvedBaseUrl = resolveBaseUrl(sourceKey, baseUrl);
  const resolvedMode = resolveSourceMode(mode);

  logLocalMdDebug('createLocalMdSourceLoader:start', {
    sourceKey,
    mode: resolvedMode,
    resolvedDir,
    baseUrl: resolvedBaseUrl,
    processCwd: process.cwd(),
    isLocalMdCacheDisabled: isLocalMdCacheDisabled(),
  });

  const source = resolvedMode === 'build'
    ? await loadBuiltSource(sourceKey, appRoot, localMdConfig)
    : await loadRuntimeSource(sourceKey, resolvedDir, localMdConfig);

  const sourceCounts = countSourceFiles(source);
  logLocalMdDebug('createLocalMdSourceLoader:before-loader', {
    sourceKey,
    mode: resolvedMode,
    resolvedDir,
    baseUrl: resolvedBaseUrl,
    processCwd: process.cwd(),
    ...sourceCounts,
  });

  const result = loader({
    i18n,
    baseUrl: resolvedBaseUrl,
    source,
    ...(icon ? { icon } : {}),
  });

  const pageTreeLocaleCounts = countLocaleTreeChildren(result.pageTree);
  const localePageCounts = countLocalePages(result);
  logLocalMdDebug('createLocalMdSourceLoader:after-loader', {
    sourceKey,
    mode: resolvedMode,
    resolvedDir,
    baseUrl: resolvedBaseUrl,
    processCwd: process.cwd(),
    ...sourceCounts,
    localePageCounts,
    pageTreeLocaleCounts,
    durationMs: getLocalMdDurationMs(startedAt),
  });

  if (sourceCounts.pageFileCount === 0 || isLoaderResultEmpty(result)) {
    logLocalMdWarn('source loader produced empty pages', {
      sourceKey,
      mode: resolvedMode,
      resolvedDir,
      baseUrl: resolvedBaseUrl,
      processCwd: process.cwd(),
      ...sourceCounts,
      localePageCounts,
      pageTreeLocaleCounts,
    });
  }

  return result;
}

async function loadBuiltSource(
  sourceKey: string,
  appRoot: string | undefined,
  localMdConfig: Omit<CreateLocalMdSourceLoaderOptions, 'sourceKey' | 'dir' | 'baseUrl' | 'sourceRootDir' | 'i18n' | 'icon' | 'mode' | 'appRoot'>,
) {
  const { createBuiltSource } = await import('./build-source');
  return createBuiltSource(sourceKey, appRoot, localMdConfig);
}

async function loadRuntimeSource(
  sourceKey: string,
  resolvedDir: string,
  localMdConfig: Omit<CreateLocalMdSourceLoaderOptions, 'sourceKey' | 'dir' | 'baseUrl' | 'sourceRootDir' | 'i18n' | 'icon' | 'mode' | 'appRoot'>,
) {
  const { createRuntimeSource } = await import('./runtime-source');
  return createRuntimeSource(sourceKey, resolvedDir, localMdConfig);
}

export function createCachedLocalMdSourceLoader<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  options: CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>,
) {
  let cached: LocalMdLoaderPromise | undefined;

  return function getLocalMdSource() {
    if (isLocalMdCacheDisabled()) {
      logLocalMdDebug('createCachedLocalMdSourceLoader:cache-disabled', {
        sourceKey: options.sourceKey ?? 'docs',
      });
      return createLocalMdSourceLoader(options);
    }

    if (cached) {
      logLocalMdDebug('createCachedLocalMdSourceLoader:cache-hit', {
        sourceKey: options.sourceKey ?? 'docs',
      });
      return cached;
    }

    logLocalMdDebug('createCachedLocalMdSourceLoader:cache-miss', {
      sourceKey: options.sourceKey ?? 'docs',
    });
    cached = createLocalMdSourceLoader(options);
    return cached;
  };
}

export function createConfiguredLocalMdSourceFactory<
  FrontmatterSchema extends StandardSchemaV1 = StandardSchemaV1,
  MetaSchema extends StandardSchemaV1 = StandardSchemaV1,
>(
  options: ConfiguredLocalMdSourceFactoryOptions<FrontmatterSchema, MetaSchema>,
) {
  const cache = new Map<string, LocalMdLoaderPromise>();
  const inFlight = new Map<string, LocalMdLoaderPromise>();

  return {
    async getSource(
      sourceKey: string,
      overrides: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'i18n' | 'icon' | 'sourceRootDir'> = {},
    ) {
      return createLocalMdSourceLoader({
        ...options,
        ...overrides,
        sourceKey,
      });
    },
    async getCachedSource(
      sourceKey: string,
      overrides: Omit<CreateLocalMdSourceLoaderOptions<FrontmatterSchema, MetaSchema>, 'i18n' | 'icon' | 'sourceRootDir'> = {},
    ) {
      const resolvedDir = resolveSourceDir(sourceKey, overrides.dir, options.sourceRootDir);
      const resolvedBaseUrl = resolveBaseUrl(sourceKey, overrides.baseUrl);
      const cacheKey = `${sourceKey}:${resolvedDir}:${resolvedBaseUrl}:${overrides.mode ?? options.mode ?? 'auto'}`;

      if (isLocalMdCacheDisabled()) {
        const existingInFlight = inFlight.get(cacheKey);
        if (existingInFlight) {
          logLocalMdDebug('getCachedSource:inflight-hit', {
            sourceKey,
            cacheKey,
            resolvedDir,
            baseUrl: resolvedBaseUrl,
            processCwd: process.cwd(),
          });
          return existingInFlight;
        }

        logLocalMdDebug('getCachedSource:cache-disabled', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
        });

        const created = createLocalMdSourceLoader({
          ...options,
          ...overrides,
          sourceKey,
        });

        inFlight.set(cacheKey, created);
        created.finally(() => {
          if (inFlight.get(cacheKey) === created) {
            inFlight.delete(cacheKey);
          }
        });

        return created;
      }

      const existing = cache.get(cacheKey);
      if (existing) {
        logLocalMdDebug('getCachedSource:cache-hit', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
        });
        return existing;
      }

      logLocalMdDebug('getCachedSource:cache-miss', {
        sourceKey,
        cacheKey,
        resolvedDir,
        baseUrl: resolvedBaseUrl,
        processCwd: process.cwd(),
        isLocalMdCacheDisabled: isLocalMdCacheDisabled(),
      });

      const created = (async () => {
        const result = await createLocalMdSourceLoader({
          ...options,
          ...overrides,
          sourceKey,
        });
        const empty = isLoaderResultEmpty(result);

        logLocalMdDebug('getCachedSource:created', {
          sourceKey,
          cacheKey,
          resolvedDir,
          baseUrl: resolvedBaseUrl,
          processCwd: process.cwd(),
          empty,
          localePageCounts: countLocalePages(result),
          pageTreeLocaleCounts: countLocaleTreeChildren(result.pageTree),
        });

        if (empty && !shouldCacheEmptySource()) {
          cache.delete(cacheKey);
          logLocalMdWarn('skip caching empty source result', {
            sourceKey,
            cacheKey,
            resolvedDir,
            baseUrl: resolvedBaseUrl,
            processCwd: process.cwd(),
          });
          return result;
        }

        if (empty) {
          logLocalMdWarn('caching empty source result because LOCAL_MD_CACHE_EMPTY=true', {
            sourceKey,
            cacheKey,
            resolvedDir,
            baseUrl: resolvedBaseUrl,
            processCwd: process.cwd(),
          });
        }

        return result;
      })();

      cache.set(cacheKey, created);
      return created;
    },
  };
}
