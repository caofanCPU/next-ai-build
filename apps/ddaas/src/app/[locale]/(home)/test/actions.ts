'use server';

import {
  deleteKey,
  getCounter,
  getHashAll,
  getJson,
  getString,
  incrCounter,
  listLength,
  mgetJson,
  popList,
  pushList,
  rangeList,
  setJson,
  setHashField,
  setString,
  withLock,
  withRedis,
} from '@core/upstash/server';

const TEST_TTL_SECONDS = 60 * 60;
const RUNTIME_ENV = process.env.NODE_ENV ?? 'development';
const TEST_PREFIX = `nextai-${RUNTIME_ENV}-test`;

const TEST_KEYS = {
  string: `${TEST_PREFIX}:string:profile`,
  hash: `${TEST_PREFIX}:hash:user`,
  json: `${TEST_PREFIX}:json:profile`,
  list: `${TEST_PREFIX}:list:tasks`,
  counter: `${TEST_PREFIX}:counter:views`,
  lock: `${TEST_PREFIX}:lock:demo`,
  lockAudit: `${TEST_PREFIX}:counter:lock-success`,
} as const;

export type UpstashSnapshot = {
  env: string;
  prefix: string;
  redisAvailable: boolean;
  stringValue: string | null;
  hashValue: Record<string, string> | null;
  jsonKey: string;
  jsonValue: unknown | null;
  jsonMgetValue: unknown | null;
  listValue: string[] | null;
  listLength: number | null;
  counterValue: number | null;
  lockSuccessCount: number | null;
};

export type UpstashActionResult = {
  ok: boolean;
  message: string;
  timestamp: string;
  snapshot: UpstashSnapshot;
  lockReport?: {
    concurrency: number;
    ttlMs: number;
    successCount: number;
    failedCount: number;
    elapsedMs: number;
  };
};

type UpstashActionInput =
  | { type: 'check' }
  | { type: 'setString'; value: string }
  | { type: 'setHashField'; field: string; value: string }
  | { type: 'setJson'; value: string }
  | { type: 'getJson' }
  | { type: 'pushList'; value: string; direction: 'left' | 'right' }
  | { type: 'popList'; direction: 'left' | 'right' }
  | { type: 'incrCounter'; delta: number }
  | { type: 'runLockTest'; concurrency: number; ttlMs: number }
  | { type: 'clearAll' }
  | { type: 'refresh' };

const withTtl = async (keys: string[]): Promise<void> => {
  await withRedis(async (redis) => {
    await Promise.all(keys.map((key) => redis.expire(key, TEST_TTL_SECONDS)));
  });
};

const loadSnapshot = async (): Promise<UpstashSnapshot> => {
  const redisAvailable = (await withRedis(async () => true)) ?? false;

  if (!redisAvailable) {
    return {
      env: RUNTIME_ENV,
      prefix: TEST_PREFIX,
      redisAvailable: false,
      stringValue: null,
      hashValue: null,
      jsonKey: TEST_KEYS.json,
      jsonValue: null,
      jsonMgetValue: null,
      listValue: null,
      listLength: null,
      counterValue: null,
      lockSuccessCount: null,
    };
  }

  const [
    stringValue,
    hashValue,
    jsonValue,
    jsonMgetValues,
    listValue,
    currentListLength,
    counterValue,
    lockSuccessCount,
  ] =
    await Promise.all([
      getString(TEST_KEYS.string),
      getHashAll(TEST_KEYS.hash),
      getJson<unknown>(TEST_KEYS.json),
      mgetJson<unknown>([TEST_KEYS.json]),
      rangeList(TEST_KEYS.list),
      listLength(TEST_KEYS.list),
      getCounter(TEST_KEYS.counter),
      getCounter(TEST_KEYS.lockAudit),
    ]);

  return {
    env: RUNTIME_ENV,
    prefix: TEST_PREFIX,
    redisAvailable: true,
    stringValue,
    hashValue,
    jsonKey: TEST_KEYS.json,
    jsonValue,
    jsonMgetValue: jsonMgetValues?.[0] ?? null,
    listValue,
    listLength: currentListLength,
    counterValue,
    lockSuccessCount,
  };
};

const buildResult = async (
  ok: boolean,
  message: string,
  lockReport?: UpstashActionResult['lockReport']
): Promise<UpstashActionResult> => {
  return {
    ok,
    message,
    lockReport,
    timestamp: new Date().toISOString(),
    snapshot: await loadSnapshot(),
  };
};

export const getUpstashSnapshot = async (): Promise<UpstashSnapshot> => {
  return loadSnapshot();
};

export const runUpstashAction = async (input: UpstashActionInput): Promise<UpstashActionResult> => {
  try {
    switch (input.type) {
      case 'check': {
        const ok = (await withRedis(async () => true)) ?? false;
        return buildResult(ok, ok ? 'Redis 可用，初始化与单例访问正常' : 'Redis 不可用，请检查 Upstash 环境变量');
      }

      case 'setString': {
        const ok = await setString(TEST_KEYS.string, input.value, TEST_TTL_SECONDS);
        return buildResult(ok, ok ? 'String 写入成功(TTL 1 小时)' : 'String 写入失败');
      }

      case 'setHashField': {
        const ok = await setHashField(TEST_KEYS.hash, input.field, input.value);
        if (ok) {
          await withTtl([TEST_KEYS.hash]);
        }
        return buildResult(ok, ok ? 'Hash 字段写入成功(TTL 1 小时)' : 'Hash 字段写入失败');
      }

      case 'setJson': {
        let value: unknown;
        try {
          value = JSON.parse(input.value);
        } catch {
          return buildResult(false, 'JSON 格式不合法，写入已取消');
        }

        const ok = await setJson(TEST_KEYS.json, value, TEST_TTL_SECONDS);
        return buildResult(ok, ok ? 'JSON 写入成功(TTL 1 小时)' : 'JSON 写入失败');
      }

      case 'getJson': {
        const value = await getJson<unknown>(TEST_KEYS.json);
        return buildResult(value !== null, value !== null ? 'JSON 查询成功' : 'JSON 不存在或 Redis 不可用');
      }

      case 'pushList': {
        const length = await pushList(TEST_KEYS.list, [input.value], input.direction);
        if (typeof length === 'number') {
          await withTtl([TEST_KEYS.list]);
        }
        return buildResult(
          typeof length === 'number',
          typeof length === 'number' ? `List 写入成功，当前长度 ${length}(TTL 1 小时)` : 'List 写入失败'
        );
      }

      case 'popList': {
        const popped = await popList(TEST_KEYS.list, input.direction);
        if (popped !== null) {
          await withTtl([TEST_KEYS.list]);
        }
        return buildResult(true, popped ? `List 弹出成功，值：${popped}` : 'List 为空或 Redis 不可用');
      }

      case 'incrCounter': {
        const value = await incrCounter(TEST_KEYS.counter, input.delta);
        if (typeof value === 'number') {
          await withTtl([TEST_KEYS.counter]);
        }
        return buildResult(
          typeof value === 'number',
          typeof value === 'number' ? `Counter 更新成功，当前值 ${value}(TTL 1 小时)` : 'Counter 更新失败'
        );
      }

      case 'runLockTest': {
        const startedAt = Date.now();
        let successCount = 0;
        let failedCount = 0;

        await Promise.all(
          Array.from({ length: input.concurrency }, async () => {
            const result = await withLock(TEST_KEYS.lock, input.ttlMs, async () => {
              successCount += 1;
              await incrCounter(TEST_KEYS.lockAudit, 1);
              await new Promise((resolve) => setTimeout(resolve, 350));
              return true;
            });

            if (result === null) {
              failedCount += 1;
            }
          })
        );

        const elapsedMs = Date.now() - startedAt;
        await withTtl([TEST_KEYS.lockAudit]);

        return buildResult(true, '分布式锁并发测试完成', {
          concurrency: input.concurrency,
          ttlMs: input.ttlMs,
          successCount,
          failedCount,
          elapsedMs,
        });
      }

      case 'clearAll': {
        await Promise.all(Object.values(TEST_KEYS).map((key) => deleteKey(key)));
        return buildResult(true, '测试数据已清空');
      }

      case 'refresh': {
        return buildResult(true, '数据已刷新');
      }

      default: {
        return buildResult(false, '未知操作');
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知异常';
    return buildResult(false, `操作异常：${message}`);
  }
};
