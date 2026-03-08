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
  const [listValue, setListValue] = useState('task-1');
  const [counterDelta, setCounterDelta] = useState(1);
  const [lockConcurrency, setLockConcurrency] = useState(5);
  const [lockTtlMs, setLockTtlMs] = useState(1200);

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
  const hasResult = Boolean(result);
  const resultBadgeClass = result?.ok
    ? 'border-emerald-300/60 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
    : 'border-rose-300/60 bg-rose-100 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300';

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
              className={ghostBtnClass}
              onClick={() => runAction({ type: 'clearAll' })}
              disabled={isPending}
            >
              清空测试数据
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">环境：{snapshot.env}</div>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">Redis 状态：{statusText}</div>
          <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">缓存 TTL：除锁外均 1 小时</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={panelClass}>
          <h2 className="text-base font-semibold text-foreground">String / Hash</h2>
          <div className="mt-3 space-y-3">
            <input
              className={inputClass}
              value={stringValue}
              onChange={(event) => setStringValue(event.target.value)}
              placeholder="String value"
            />
            <button
              type="button"
              className={`${primaryBtnClass} w-full sm:w-auto`}
              onClick={() => runAction({ type: 'setString', value: stringValue })}
              disabled={isPending}
            >
              写入 String
            </button>

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
            </div>
            <button
              type="button"
              className={`${primaryBtnClass} w-full sm:w-auto`}
              onClick={() => runAction({ type: 'setHashField', field: hashField, value: hashValue })}
              disabled={isPending}
            >
              写入 Hash 字段
            </button>
          </div>
        </article>

        <article className={panelClass}>
          <h2 className="text-base font-semibold text-foreground">List / Counter</h2>
          <div className="mt-3 space-y-3">
            <input
              className={inputClass}
              value={listValue}
              onChange={(event) => setListValue(event.target.value)}
              placeholder="List value"
            />
            <div className="grid gap-2 sm:grid-cols-2">
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

            <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <input
                type="number"
                className={inputClass}
                value={counterDelta}
                onChange={(event) => setCounterDelta(Number(event.target.value))}
              />
              <button
                type="button"
                className={`${primaryBtnClass} w-full`}
                onClick={() => runAction({ type: 'incrCounter', delta: counterDelta })}
                disabled={isPending}
              >
                更新 Counter
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className={panelClass}>
        <h2 className="text-base font-semibold text-foreground">分布式锁实验</h2>
        <p className="mt-1 text-sm text-muted-foreground">并发抢同一把锁，观察成功进入临界区次数。</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">并发数：{result.lockReport.concurrency}</div>
            <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">成功：{result.lockReport.successCount}</div>
            <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">失败：{result.lockReport.failedCount}</div>
            <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">耗时：{result.lockReport.elapsedMs}ms</div>
          </div>
        ) : null}
      </section>

      <section className={panelClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-foreground">测试数据总览</h2>
          <button
            type="button"
            className={ghostBtnClass}
            onClick={() => runAction({ type: 'refresh' })}
            disabled={isPending}
          >
            刷新
          </button>
        </div>

        <pre className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-muted/70 p-4 text-xs text-foreground">
{formatJson(snapshot)}
        </pre>
      </section>

      <section className={panelClass}>
        <h2 className="text-base font-semibold text-foreground">最近操作结果</h2>
        {hasResult ? (
          <div className="mt-3 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${resultBadgeClass}`}>
                状态：{result?.ok ? '成功' : '失败'}
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                时间：{result?.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                Redis：{result?.snapshot.redisAvailable ? '可用' : '不可用'}
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
                锁成功累计：{result?.snapshot.lockSuccessCount ?? 0}
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground">
              {result?.message}
            </div>
            {result?.lockReport ? (
              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                  并发数：{result.lockReport.concurrency}
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                  成功/失败：{result.lockReport.successCount}/{result.lockReport.failedCount}
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                  锁 TTL：{result.lockReport.ttlMs}ms
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2">
                  总耗时：{result.lockReport.elapsedMs}ms
                </div>
              </div>
            ) : null}
            <details className="rounded-lg border border-border/60 bg-muted/20 p-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">查看原始结果 JSON</summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted/70 p-3 text-xs text-foreground">
{formatJson(result)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            暂无操作记录，请先执行一次测试操作。
          </div>
        )}
      </section>
    </div>
  );
}
