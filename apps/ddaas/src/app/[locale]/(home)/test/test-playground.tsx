'use client';

import { useMemo, useState, useTransition } from 'react';
import type { UpstashActionResult, UpstashSnapshot } from './actions';
import { runUpstashAction } from './actions';

type Props = {
  initialSnapshot: UpstashSnapshot;
};

const formatJson = (value: unknown): string => JSON.stringify(value, null, 2);

export function TestPlayground({ initialSnapshot }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UpstashActionResult | null>(null);
  const [stringValue, setStringValue] = useState('hello-nextai');
  const [hashField, setHashField] = useState('name');
  const [hashValue, setHashValue] = useState('upstash-tester');
  const [jsonValue, setJsonValue] = useState(`{
  "id": 10666,
  "title": "Redis JSON cache probe",
  "tags": ["upstash", "mgetJson"],
  "meta": {
    "source": "ddaas-test-page",
    "enabled": true
  }
}`);
  const [listValue, setListValue] = useState('task-1');
  const [counterDelta, setCounterDelta] = useState(1);
  const [lockConcurrency, setLockConcurrency] = useState(5);
  const [lockTtlMs, setLockTtlMs] = useState(1200);
  const [activeTab, setActiveTab] = useState<'string' | 'hash' | 'list' | 'counter' | 'lock'>('string');

  const snapshot = result?.snapshot ?? initialSnapshot;

  const statusText = useMemo(() => (snapshot.redisAvailable ? '可用' : '不可用'), [snapshot.redisAvailable]);

  const runAction = (action: Parameters<typeof runUpstashAction>[0]) => {
    startTransition(async () => {
      const actionResult = await runUpstashAction(action);
      setResult(actionResult);
    });
  };

  const panelClass =
    'rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70 md:p-5';
  const inputClass =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background transition focus:ring-2 focus:ring-primary/40';
  const primaryBtnClass =
    'inline-flex items-center justify-center rounded-full border border-white/20 bg-linear-to-r from-purple-400 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-purple-500 hover:to-pink-600 hover:shadow-xl hover:shadow-pink-500/25 dark:from-purple-500 dark:to-pink-600 dark:hover:from-purple-600 dark:hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50';
  const ghostBtnClass =
    'inline-flex items-center justify-center rounded-full border border-border/80 bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-muted hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50';
  const infoBtnClass =
    'inline-flex items-center justify-center rounded-full border border-cyan-300/70 bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-200 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 dark:hover:bg-cyan-900/60 disabled:cursor-not-allowed disabled:opacity-50';
  const dangerBtnClass =
    'inline-flex items-center justify-center rounded-full border border-rose-300/70 bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-800 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-200 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 disabled:cursor-not-allowed disabled:opacity-50';
  const hasResult = Boolean(result);
  const resultBadgeClass = result?.ok
    ? 'rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
    : 'rounded-full border border-rose-300/70 bg-rose-100 px-3 py-1 text-sm font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
  const tabBtnClass = (active: boolean): string =>
    active
      ? `${primaryBtnClass} min-w-[108px]`
      : `${ghostBtnClass} min-w-[108px]`;

  return (
    <div className="relative mt-12 mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-6 sm:px-4 md:gap-6 md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-linear-to-b from-primary/10 via-primary/5 to-transparent" />

      <section className={panelClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Upstash Redis Playground</h1>
            <p className="mt-1 text-sm text-muted-foreground">固定前缀：{snapshot.prefix}</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:flex">
            <button
              type="button"
              className={primaryBtnClass}
              onClick={() => runAction({ type: 'check' })}
              disabled={isPending}
            >
              连接检查
            </button>
            <button
              type="button"
              className={dangerBtnClass}
              onClick={() => runAction({ type: 'clearAll' })}
              disabled={isPending}
            >
              清空数据
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 font-medium text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
            环境：{snapshot.env}
          </span>
          <span className="rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Redis 状态：{statusText}
          </span>
          <span className="rounded-full border border-amber-300/70 bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            缓存 TTL：除锁外均 1 小时
          </span>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">JSON 缓存测试</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              固定 key：{snapshot.jsonKey}
            </p>
          </div>
          <button
            type="button"
            className={infoBtnClass}
            onClick={() => runAction({ type: 'getJson' })}
            disabled={isPending}
          >
            查询 JSON
          </button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">写入 JSON</h3>
              <span className="rounded-full border border-amber-300/70 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                TTL 1 小时
              </span>
            </div>
            <textarea
              className={`${inputClass} min-h-64 resize-y font-mono text-xs leading-relaxed`}
              value={jsonValue}
              onChange={(event) => setJsonValue(event.target.value)}
              spellCheck={false}
              placeholder="输入合法 JSON"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={`${primaryBtnClass} w-full sm:w-auto`}
                onClick={() => runAction({ type: 'setJson', value: jsonValue })}
                disabled={isPending}
              >
                存 JSON
              </button>
              <button
                type="button"
                className={`${ghostBtnClass} w-full sm:w-auto`}
                onClick={() => runAction({ type: 'getJson' })}
                disabled={isPending}
              >
                读 JSON
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">Redis 读出 JSON</h3>
              <span className="rounded-full border border-cyan-300/70 bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
                getJson / mgetJson
              </span>
            </div>
            <div className="grid gap-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">getJson</p>
                <pre className="min-h-28 overflow-x-auto rounded-lg border border-border/60 bg-background/80 p-3 text-xs text-foreground">
{formatJson(snapshot.jsonValue)}
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">mgetJson([key]) 第 1 项</p>
                <pre className="min-h-28 overflow-x-auto rounded-lg border border-border/60 bg-background/80 p-3 text-xs text-foreground">
{formatJson(snapshot.jsonMgetValue)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={panelClass}>
        <div className="grid grid-cols-3 justify-items-start gap-2 sm:grid-cols-5 lg:grid-cols-7">
          <button
            type="button"
            className={tabBtnClass(activeTab === 'string')}
            onClick={() => setActiveTab('string')}
            disabled={isPending}
          >
            String
          </button>
          <button
            type="button"
            className={tabBtnClass(activeTab === 'hash')}
            onClick={() => setActiveTab('hash')}
            disabled={isPending}
          >
            Hash
          </button>
          <button
            type="button"
            className={tabBtnClass(activeTab === 'list')}
            onClick={() => setActiveTab('list')}
            disabled={isPending}
          >
            List
          </button>
          <button
            type="button"
            className={tabBtnClass(activeTab === 'counter')}
            onClick={() => setActiveTab('counter')}
            disabled={isPending}
          >
            Counter
          </button>
          <button
            type="button"
            className={tabBtnClass(activeTab === 'lock')}
            onClick={() => setActiveTab('lock')}
            disabled={isPending}
          >
            分布式锁
          </button>
        </div>

        <div className="mt-4 min-h-[120px] space-y-3">
          {activeTab === 'string' ? (
            <>
              <p className="text-sm text-muted-foreground">测试字符串写入与覆盖(缓存 TTL 1 小时)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={stringValue}
                  onChange={(event) => setStringValue(event.target.value)}
                  placeholder="String value"
                />
                <div className="hidden sm:block" />
                <button
                  type="button"
                  className={`${primaryBtnClass} w-full sm:w-auto`}
                  onClick={() => runAction({ type: 'setString', value: stringValue })}
                  disabled={isPending}
                >
                  写入 String
                </button>
                <div className="hidden sm:block" />
              </div>
            </>
          ) : null}

          {activeTab === 'hash' ? (
            <>
              <p className="text-sm text-muted-foreground">测试 Hash 字段写入(缓存 TTL 1 小时)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={hashField}
                  onChange={(event) => setHashField(event.target.value)}
                  placeholder="Hash field"
                />
                <input
                  className={inputClass}
                  value={hashValue}
                  onChange={(event) => setHashValue(event.target.value)}
                  placeholder="Hash value"
                />
                <button
                  type="button"
                  className={`${primaryBtnClass} w-full sm:w-auto`}
                  onClick={() => runAction({ type: 'setHashField', field: hashField, value: hashValue })}
                  disabled={isPending}
                >
                  写入 Hash 字段
                </button>
                <div className="hidden sm:block" />
              </div>
            </>
          ) : null}

          {activeTab === 'list' ? (
            <>
              <p className="text-sm text-muted-foreground">测试 List 入队和出队(缓存 TTL 1 小时)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  className={inputClass}
                  value={listValue}
                  onChange={(event) => setListValue(event.target.value)}
                  placeholder="List value"
                />
                <div className="hidden sm:block" />
                <button
                  type="button"
                  className={`${primaryBtnClass} w-full`}
                  onClick={() => runAction({ type: 'pushList', value: listValue, direction: 'right' })}
                  disabled={isPending}
                >
                  右侧入队
                </button>
                <button
                  type="button"
                  className={`${ghostBtnClass} w-full`}
                  onClick={() => runAction({ type: 'popList', direction: 'left' })}
                  disabled={isPending}
                >
                  左侧出队
                </button>
              </div>
            </>
          ) : null}

          {activeTab === 'counter' ? (
            <>
              <p className="text-sm text-muted-foreground">测试 Counter 自增/自减(缓存 TTL 1 小时)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="number"
                  className={inputClass}
                  value={counterDelta}
                  onChange={(event) => setCounterDelta(Number(event.target.value))}
                  placeholder="delta"
                />
                <div className="hidden sm:block" />
                <button
                  type="button"
                  className={`${primaryBtnClass} w-full sm:w-auto`}
                  onClick={() => runAction({ type: 'incrCounter', delta: counterDelta })}
                  disabled={isPending}
                >
                  更新 Counter
                </button>
                <div className="hidden sm:block" />
              </div>
            </>
          ) : null}

          {activeTab === 'lock' ? (
            <>
              <p className="text-sm text-muted-foreground">并发抢同一把锁，观察成功进入临界区次数</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={lockConcurrency}
                  onChange={(event) => setLockConcurrency(Number(event.target.value))}
                  placeholder="并发数"
                />
                <input
                  type="number"
                  min={300}
                  className={inputClass}
                  value={lockTtlMs}
                  onChange={(event) => setLockTtlMs(Number(event.target.value))}
                  placeholder="TTL ms"
                />
                <button
                  type="button"
                  className={`${primaryBtnClass} w-full`}
                  onClick={() => runAction({ type: 'runLockTest', concurrency: lockConcurrency, ttlMs: lockTtlMs })}
                  disabled={isPending}
                >
                  开始抢锁测试
                </button>
              </div>
            {result?.lockReport ? (
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 font-medium text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                  并发数：{result.lockReport.concurrency}
                </div>
                <div className="rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  成功：{result.lockReport.successCount}
                </div>
                <div className="rounded-full border border-rose-300/70 bg-rose-100 px-3 py-1 font-medium text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                  失败：{result.lockReport.failedCount}
                </div>
                <div className="rounded-full border border-amber-300/70 bg-amber-100 px-3 py-1 font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  耗时：{result.lockReport.elapsedMs}ms
                </div>
              </div>
            ) : (
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-full border border-dashed border-indigo-300/70 bg-indigo-50 px-3 py-1 text-indigo-600 dark:border-indigo-900 dark:bg-indigo-950/20 dark:text-indigo-300">并发数：-</div>
                  <div className="rounded-full border border-dashed border-emerald-300/70 bg-emerald-50 px-3 py-1 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">成功：-</div>
                  <div className="rounded-full border border-dashed border-rose-300/70 bg-rose-50 px-3 py-1 text-rose-600 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">失败：-</div>
                  <div className="rounded-full border border-dashed border-amber-300/70 bg-amber-50 px-3 py-1 text-amber-600 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">耗时：-</div>
              </div>
            )}
          </>
        ) : null}
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-foreground">最近操作结果</h2>
          {result?.message ? (
            <span className="text-sm text-muted-foreground">
              {result.message}
            </span>
          ) : null}
        </div>
        {hasResult ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className={resultBadgeClass}>
                状态：{result?.ok ? '成功' : '失败'}
              </div>
              <div className="rounded-full border border-cyan-300/70 bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
                时间：{result?.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}
              </div>
              <div className="rounded-full border border-emerald-300/70 bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                Redis：{result?.snapshot.redisAvailable ? '可用' : '不可用'}
              </div>
              <div className="rounded-full border border-indigo-300/70 bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
                锁成功累计：{result?.snapshot.lockSuccessCount ?? 0}
              </div>
            </div>
            <details className="rounded-lg border border-border/60 bg-muted/20 p-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">查看原始结果 JSON</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-border/60 bg-background/80 p-3 text-xs text-foreground">
{formatJson(result)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            暂无操作记录，请先执行一次测试操作
          </div>
        )}
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-foreground">测试数据总览</h2>
          <button
            type="button"
            className={infoBtnClass}
            onClick={() => runAction({ type: 'refresh' })}
            disabled={isPending}
          >
            实时刷新
          </button>
        </div>

        <pre className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-muted/70 p-4 text-xs text-foreground">
{formatJson(snapshot)}
        </pre>
      </section>
    </div>
  );
}
