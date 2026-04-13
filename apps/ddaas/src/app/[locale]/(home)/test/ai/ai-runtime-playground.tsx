'use client';

import { useMemo, useState } from 'react';
import {
  AIChatComposer,
  AIMessageList,
  useAIConversation,
} from '@windrun-huaiin/third-ui/ai';
import { XPillSelect, type XPillOption } from '@third-ui/main/pill-select';

const shellClass =
  'mx-auto mt-12 flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:px-4 md:gap-8 md:px-6 md:py-8';
const panelClass =
  'rounded-[28px] border border-border/60 bg-white/85 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/75 dark:bg-neutral-950/80 md:p-6';

const samplePrompts = [
  'Summarize the differences between SSR, SSG, and ISR in Next.js.',
  'Draft a concise landing page headline for an AI automation SaaS.',
  'List 5 risks to consider when building a streaming AI chat product.',
];

const mockOptions: XPillOption[] = [
  { label: '0 Success', value: '0' },
  { label: '1 First Delay', value: '1' },
  { label: '2 Immediate Timeout', value: '2' },
  { label: '3 Partial Timeout', value: '3' },
  { label: '4 Partial Aborted', value: '4' },
  { label: '5 Partial Error', value: '5' },
];

export function AIRuntimePlayground() {
  const [input, setInput] = useState('');
  const [eventCount, setEventCount] = useState(0);
  const [mockType, setMockType] = useState('0');
  const [mockTimeoutSeconds, setMockTimeoutSeconds] = useState('3');
  const [chunkDelayMs, setChunkDelayMs] = useState('100');
  const [chunkSize, setChunkSize] = useState('4');
  const conversation = useAIConversation({
    endpoint: '/api/ai/generate',
    onEvent: () => setEventCount((current) => current + 1),
  });

  const helperText = useMemo(() => {
    if (conversation.isStreaming) {
      return 'Streaming from /api/ai/generate';
    }

    if (conversation.error) {
      return conversation.error;
    }

    return 'Use this page to validate the contracts/backend-core/third-ui AI runtime chain in ddaaS.';
  }, [conversation.error, conversation.isStreaming]);

  const submit = async () => {
    const text = input.trim();
    if (!text) {
      return;
    }

    await conversation.sendMessage({
      text,
      metadata: {
        mock: {
          enabled: true,
          type: Number(mockType),
          timeoutSeconds: Number(mockTimeoutSeconds),
          chunkDelayMs: Number(chunkDelayMs),
          chunkSize: Number(chunkSize),
        },
      },
    });
    setInput('');
  };

  return (
    <main className={shellClass}>
      <section className={panelClass}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
              AI Runtime Playground
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              ddaaS AI 通路验证页
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              这个页面直接使用 `@windrun-huaiin/third-ui/ai` 和
              `@windrun-huaiin/backend-core/ai`。
              未配置 `OPENROUTER_API_KEY` 时会自动走 mock。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-muted-foreground">
              Messages: {conversation.messages.length}
            </span>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-muted-foreground">
              Events: {eventCount}
            </span>
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-muted-foreground">
              {conversation.isStreaming ? 'Streaming' : 'Idle'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          {helperText}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setInput(prompt)}
              className="rounded-full border border-border/70 bg-background/80 px-3 py-2 text-left text-xs text-foreground transition hover:bg-accent"
            >
              {prompt}
            </button>
          ))}
        </div>
      </section>

      <section className={panelClass}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <AIMessageList
              messages={conversation.messages}
              emptyText="Send a prompt to start the AI conversation."
            />
            <AIChatComposer
              value={input}
              onChange={setInput}
              onSubmit={submit}
              onStop={conversation.stopGeneration}
              isStreaming={conversation.isStreaming}
              placeholder="Ask the ddaaS AI runtime something..."
            />
            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">Mock Controls</h3>
                <span className="text-[11px] text-muted-foreground">
                  Only affects mock branch
                </span>
              </div>
              <div className="grid gap-4">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Scenario
                  </div>
                  <XPillSelect
                    mode="single"
                    size="compact"
                    value={mockType}
                    onChange={setMockType}
                    options={mockOptions}
                    allowClear={false}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Timeout Sec
                    </span>
                    <input
                      value={mockTimeoutSeconds}
                      onChange={(event) => setMockTimeoutSeconds(event.target.value)}
                      inputMode="numeric"
                      className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Chunk Delay
                    </span>
                    <input
                      value={chunkDelayMs}
                      onChange={(event) => setChunkDelayMs(event.target.value)}
                      inputMode="numeric"
                      className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      Chunk Size
                    </span>
                    <input
                      value={chunkSize}
                      onChange={(event) => setChunkSize(event.target.value)}
                      inputMode="numeric"
                      className="h-10 w-full rounded-2xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <aside className="rounded-3xl border border-border/70 bg-background/70 p-4">
            <h2 className="text-lg font-semibold text-foreground">Runtime Notes</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Assistant messages expose per-message diagnostics. `First Token` is
              measured from request send to the first streamed `text_delta`. `Total`
              is measured from request send to completion or failure.
            </p>
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="rounded-2xl border border-border/70 bg-background px-3 py-2">
                Events received: {eventCount}
              </div>
              <div className="rounded-2xl border border-border/70 bg-background px-3 py-2">
                Conversation state: {conversation.isStreaming ? 'Streaming' : 'Idle'}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
