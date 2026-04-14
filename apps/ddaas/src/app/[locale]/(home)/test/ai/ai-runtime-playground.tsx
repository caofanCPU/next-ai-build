'use client';

import { globalLucideIcons as icons } from '@base-ui/components/global-icon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@base-ui/ui';
import {
  AIChatComposer,
  AIMessageBubble,
  AIMessageList,
  AIMessageMeta,
  AIStatusIndicator,
  getMessageText,
  type ConversationMessage,
  useAIConversation,
} from '@windrun-huaiin/third-ui/ai';
import { InfoTooltip } from '@windrun-huaiin/third-ui/main';
import { cn } from '@windrun-huaiin/lib/utils';
import { XPillSelect, type XPillOption } from '@third-ui/main/pill-select';
import { useEffect, useMemo, useRef, useState } from 'react';

const shellClass =
  'mx-auto mt-12 flex h-[calc(100dvh-5.5rem)] w-full max-w-7xl flex-col gap-3 overflow-hidden px-3 py-2 sm:px-4 md:px-6 md:py-3';
const panelClass = 'rounded-3xl border border-border bg-background';
const workspaceHeightClass = 'min-h-0 flex-1';
const panelSectionClass = 'rounded-[24px] border border-border/60 bg-background/80';
const actionButtonClass =
  'inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20';
const subtleButtonClass =
  'inline-flex h-9 items-center justify-center rounded-2xl border border-border px-3 text-xs text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50';

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
  { label: '6 Markdown', value: '6' },
  { label: '7 Trophy Card', value: '7' },
];
const sessionStorageKey = 'ai-runtime-playground-sessions-v1';
const initialSessionId = 'playground-session-initial';
const mockPromptFallbacks: Record<string, string> = {
  '6': 'Render the markdown showcase scenario.',
  '7': 'Render the trophy card showcase scenario.',
};

type SessionRecord = {
  id: string;
  title: string;
  customTitle?: string;
  pinned?: boolean;
  isAutoTitle?: boolean;
  updatedAt: number;
  messages: ConversationMessage[];
};

type SidePanelMode = 'sessions' | 'config';

type RuntimeControlsProps = {
  eventCount: number;
  isStreaming: boolean;
  mockType: string;
  setMockType: (value: string) => void;
  mockTimeoutSeconds: string;
  setMockTimeoutSeconds: (value: string) => void;
  chunkDelayMs: string;
  setChunkDelayMs: (value: string) => void;
  chunkSize: string;
  setChunkSize: (value: string) => void;
};

function RuntimeControls({
  eventCount,
  isStreaming,
  mockType,
  setMockType,
  mockTimeoutSeconds,
  setMockTimeoutSeconds,
  chunkDelayMs,
  setChunkDelayMs,
  chunkSize,
  setChunkSize,
}: RuntimeControlsProps) {
  return (
    <div className="space-y-4">
      <section className={cn(panelSectionClass, 'space-y-3 p-3')}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Runtime</h3>
          <span className="text-[11px] text-muted-foreground">
            {isStreaming ? 'Streaming' : 'Idle'}
          </span>
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground">
          <div className="rounded-2xl border border-border/70 px-3 py-2">
            Events received: {eventCount}
          </div>
          <div className="rounded-2xl border border-border/70 px-3 py-2">
            Conversation state: {isStreaming ? 'Streaming' : 'Idle'}
          </div>
        </div>
      </section>

      <section className={cn(panelSectionClass, 'space-y-3 p-3')}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Mock Controls</h3>
          <span className="text-[11px] text-muted-foreground">Only affects mock branch</span>
        </div>

        <div className="space-y-4">
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

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Timeout Sec
              </span>
              <input
                value={mockTimeoutSeconds}
                onChange={(event) => setMockTimeoutSeconds(event.target.value)}
                inputMode="numeric"
                className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
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
                className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
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
                className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30"
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

function placeCursorToEnd(target: HTMLTextAreaElement | null) {
  if (!target) {
    return;
  }

  const nextPosition = target.value.length;
  target.focus();
  target.setSelectionRange(nextPosition, nextPosition);
}

function createSessionId() {
  try {
    return `playground-${crypto.randomUUID()}`;
  } catch {
    return `playground-${Math.random().toString(16).slice(2)}`;
  }
}

function getDefaultSessionTitle(messages: ConversationMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const fallbackText = firstUserMessage ? getMessageText(firstUserMessage).trim() : '';

  if (!fallbackText) {
    return 'Untitled session';
  }

  return fallbackText.length > 60 ? `${fallbackText.slice(0, 60).trim()}...` : fallbackText;
}

function getSessionDisplayTitle(session: SessionRecord) {
  return session.customTitle?.trim() || session.title || 'Untitled session';
}

function sortSessions(items: SessionRecord[]) {
  return [...items].sort((left, right) => {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
      return left.pinned ? -1 : 1;
    }

    return right.updatedAt - left.updatedAt;
  });
}

function getSessionNextUpdatedAt(session: SessionRecord) {
  const latestMessageAt = session.messages.at(-1)?.createdAt ?? 0;
  return Math.max(session.updatedAt, latestMessageAt + 1);
}

function getMaxUpdatedAt(items: SessionRecord[]) {
  return items.reduce((maxValue, item) => Math.max(maxValue, item.updatedAt), 0);
}

function createEmptySessionRecord(id: string, updatedAt: number): SessionRecord {
  return {
    id,
    title: 'New Chat',
    updatedAt,
    messages: [],
    pinned: false,
    isAutoTitle: true,
  };
}

export function AIRuntimePlayground() {
  const [input, setInput] = useState('');
  const [eventCount, setEventCount] = useState(0);
  const [mockType, setMockType] = useState('0');
  const [mockTimeoutSeconds, setMockTimeoutSeconds] = useState('3');
  const [chunkDelayMs, setChunkDelayMs] = useState('100');
  const [chunkSize, setChunkSize] = useState('4');
  const [historyOpen, setHistoryOpen] = useState(true);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [sidePanelMode, setSidePanelMode] = useState<SidePanelMode>('config');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteSessionTargetId, setDeleteSessionTargetId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SessionRecord[]>(() => [
    createEmptySessionRecord(initialSessionId, 1),
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>(initialSessionId);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const didHydrateStorageRef = useRef(false);
  const activeSession = useMemo(
    () => savedSessions.find((item) => item.id === activeSessionId) ?? savedSessions[0],
    [activeSessionId, savedSessions],
  );

  const conversation = useAIConversation({
    endpoint: '/api/ai/generate',
    initialSessionId: activeSession?.id,
    initialMessages: activeSession?.messages ?? [],
    onEvent: () => setEventCount((current) => current + 1),
  });

  useEffect(() => {
    if (didHydrateStorageRef.current) {
      return;
    }

    didHydrateStorageRef.current = true;

    try {
      const raw = window.localStorage.getItem(sessionStorageKey);
      if (!raw) {
        setStorageReady(true);
        return;
      }

      const parsed = JSON.parse(raw) as SessionRecord[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setStorageReady(true);
        return;
      }

      const nextSessions = sortSessions(parsed);
      const nextActiveSession = nextSessions[0];

      setSavedSessions(nextSessions);
      setActiveSessionId(nextActiveSession.id);
      conversation.loadConversation(nextActiveSession.messages, nextActiveSession.id);
    } catch {
      // ignore invalid local storage snapshots and keep fallback session
    } finally {
      setStorageReady(true);
    }
  }, [conversation]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    try {
      window.localStorage.setItem(sessionStorageKey, JSON.stringify(savedSessions));
    } catch {
      // ignore storage write failures in playground mode
    }
  }, [savedSessions, storageReady]);

  useEffect(() => {
    if (!expandedSessionId) {
      return;
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const currentSessionRoot = target.closest(`[data-session-item-id="${expandedSessionId}"]`);
      if (!currentSessionRoot) {
        setExpandedSessionId(null);
      }
    }

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [expandedSessionId]);

  const sessionItems = useMemo(() => sortSessions(savedSessions), [savedSessions]);

  const activeMessageId = conversation.messages.at(-1)?.id ?? null;
  const effectiveInput = input.trim() || mockPromptFallbacks[mockType] || '';

  const upsertSessionRecord = (session: SessionRecord) => {
    setSavedSessions((current) =>
      sortSessions([session, ...current.filter((item) => item.id !== session.id)]).slice(0, 20),
    );
  };

  const persistActiveSession = (options?: { touchUpdatedAt?: boolean; overrideTitle?: string }) => {
    setSavedSessions((current) =>
      current.map((session) => {
        if (session.id !== activeSessionId) {
          return session;
        }

        const hasUserMessage = conversation.messages.some((message) => message.role === 'user');
        const nextTitle = options?.overrideTitle
          ? options.overrideTitle
          : session.isAutoTitle && hasUserMessage
            ? getDefaultSessionTitle(conversation.messages)
            : session.title;

        return {
          ...session,
          title: nextTitle,
          isAutoTitle: options?.overrideTitle
            ? false
            : session.isAutoTitle && !hasUserMessage,
          messages: conversation.messages,
          updatedAt: options?.touchUpdatedAt ? getSessionNextUpdatedAt(session) : session.updatedAt,
        };
      }),
    );
  };

  const submit = async () => {
    const text = effectiveInput;
    if (!text) {
      return;
    }

    const activeSessionRecord = savedSessions.find((item) => item.id === activeSessionId);
    if (activeSessionRecord?.isAutoTitle) {
      const normalizedTitle = text.length > 60 ? `${text.slice(0, 60).trim()}...` : text;
      persistActiveSession({
        touchUpdatedAt: true,
        overrideTitle: normalizedTitle,
      });
    } else {
      persistActiveSession({ touchUpdatedAt: true });
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

  const createFreshSession = () => {
    persistActiveSession();

    const nextSessionId = createSessionId();

    setSavedSessions((current) => {
      const nextUpdatedAt = getMaxUpdatedAt(current) + 1;
      return sortSessions([createEmptySessionRecord(nextSessionId, nextUpdatedAt), ...current]).slice(0, 20);
    });

    conversation.resetConversation();
    conversation.loadConversation([], nextSessionId);
    setInput('');
    setDeleteTargetId(null);
    setDeleteSessionTargetId(null);
    setEditingSessionId(null);
    setEditingSessionTitle('');
    setSidePanelMode('sessions');
    setExpandedSessionId(null);
    setActiveSessionId(nextSessionId);
    window.requestAnimationFrame(() => {
      placeCursorToEnd(textareaRef.current);
    });
  };

  const loadSession = (session: SessionRecord) => {
    if (session.id === activeSessionId) {
      setExpandedSessionId(null);
      setMobileHistoryOpen(false);
      return;
    }

    persistActiveSession();

    setActiveSessionId(session.id);
    conversation.loadConversation(session.messages, session.id);
    setInput('');
    setEditingSessionId(null);
    setEditingSessionTitle('');
    setExpandedSessionId(null);
    setMobileHistoryOpen(false);
  };

  const startEditingSession = (session: SessionRecord) => {
    setEditingSessionId(session.id);
    setEditingSessionTitle(getSessionDisplayTitle(session));
  };

  const saveSessionTitle = (sessionId: string) => {
    const normalizedTitle = editingSessionTitle.trim();
    const targetSession = sessionItems.find((item) => item.id === sessionId);

    if (!targetSession) {
      setEditingSessionId(null);
      setEditingSessionTitle('');
      return;
    }

    const nextCustomTitle = normalizedTitle && normalizedTitle !== targetSession.title
      ? normalizedTitle
      : undefined;

    upsertSessionRecord({
      ...targetSession,
      customTitle: nextCustomTitle,
    });

    setEditingSessionId(null);
    setEditingSessionTitle('');
    setExpandedSessionId(null);
  };

  const toggleSessionPinned = (sessionId: string) => {
    const targetSession = sessionItems.find((item) => item.id === sessionId);
    if (!targetSession) {
      return;
    }

    upsertSessionRecord({
      ...targetSession,
      pinned: !targetSession.pinned,
      updatedAt: getSessionNextUpdatedAt(targetSession),
    });

    setExpandedSessionId(null);
  };

  const deleteSession = () => {
    if (!deleteSessionTargetId) {
      return;
    }

    const remainingSessions = savedSessions.filter((item) => item.id !== deleteSessionTargetId);

    if (deleteSessionTargetId === activeSessionId) {
      if (remainingSessions.length > 0) {
        const nextActiveSession = sortSessions(remainingSessions)[0];
        conversation.loadConversation(nextActiveSession.messages, nextActiveSession.id);
        setActiveSessionId(nextActiveSession.id);
      } else {
        const nextSessionId = createSessionId();
        const nextSession = createEmptySessionRecord(nextSessionId, 1);
        remainingSessions.push(nextSession);
        conversation.loadConversation([], nextSessionId);
        setActiveSessionId(nextSessionId);
      }

      setInput('');
    }

    setSavedSessions(sortSessions(remainingSessions));

    setDeleteSessionTargetId(null);
    setEditingSessionId(null);
    setEditingSessionTitle('');
    setExpandedSessionId(null);
  };

  const copyMessage = async (messageId: string, text: string) => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === messageId ? null : current));
      }, 1200);
    } catch {
      // ignore clipboard failures in playground mode
    }
  };

  const reuseMessage = (text: string) => {
    if (!text) {
      return;
    }

    setInput(text);
    window.requestAnimationFrame(() => {
      placeCursorToEnd(textareaRef.current);
    });
  };

  const retryFromMessage = (message: ConversationMessage) => {
    const index = conversation.messages.findIndex((item) => item.id === message.id);
    if (index <= 0) {
      return;
    }

    const previousUserMessage = [...conversation.messages.slice(0, index)]
      .reverse()
      .find((item) => item.role === 'user');

    if (!previousUserMessage) {
      return;
    }

    reuseMessage(getMessageText(previousUserMessage));
  };

  const deleteMessage = () => {
    if (!deleteTargetId) {
      return;
    }

    conversation.removeMessage(deleteTargetId);
    setDeleteTargetId(null);
  };

  const historyPanel = (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-hidden">
        {sidePanelMode === 'sessions' ? (
          <section className="flex h-full min-h-0 w-full min-w-0 flex-col">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recent sessions
              </h3>
              <span className="text-[10px] text-muted-foreground">{sessionItems.length}</span>
            </div>

            <div className="min-h-0 w-full min-w-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
              {sessionItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 px-3 py-4 text-xs leading-6 text-muted-foreground">
                  No saved sessions yet. Send a few messages, then use the footer plus button to
                  create a fresh session and archive the current one.
                </div>
              ) : (
                <div className="grid w-full min-w-0 grid-cols-1 gap-2 overflow-x-hidden">
                  {sessionItems.map((item) => (
                    <div
                      key={item.id}
                      data-session-item-id={item.id}
                      className={cn(
                        'relative flex w-full min-w-0 max-w-none flex-col rounded-2xl px-3 py-2.5 text-left transition',
                        item.id === activeSessionId
                          ? 'bg-slate-300 dark:bg-slate-800'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/40 dark:hover:bg-slate-800/65',
                      )}
                    >
                      {editingSessionId === item.id ? (
                        <input
                          value={editingSessionTitle}
                          autoFocus
                          onChange={(event) => setEditingSessionTitle(event.target.value)}
                          onBlur={() => saveSessionTitle(item.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveSessionTitle(item.id);
                            }

                            if (event.key === 'Escape') {
                              setEditingSessionId(null);
                              setEditingSessionTitle('');
                            }
                          }}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-foreground/30"
                        />
                      ) : (
                        <>
                          <div className="flex w-full min-w-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => loadSession(item)}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              {item.pinned ? (
                                <icons.Pin className="size-3.5 shrink-0 text-muted-foreground" />
                              ) : null}
                              <span className="min-w-0 flex-1 truncate text-sm leading-6 text-foreground">
                                {getSessionDisplayTitle(item)}
                              </span>
                            </button>

                            <button
                              type="button"
                              title={expandedSessionId === item.id ? 'Collapse session actions' : 'Expand session actions'}
                              aria-label={expandedSessionId === item.id ? 'Collapse session actions' : 'Expand session actions'}
                              onClick={() => {
                                setExpandedSessionId((current) => (current === item.id ? null : item.id));
                              }}
                              className={actionButtonClass}
                            >
                              <icons.EllipsisVertical className="size-4" />
                            </button>
                          </div>

                          {expandedSessionId === item.id ? (
                            <div className="mt-2 flex items-center justify-end gap-0.5">
                              <button
                                type="button"
                                title="Edit session title"
                                aria-label="Edit session title"
                                onClick={() => startEditingSession(item)}
                                className={actionButtonClass}
                              >
                                <icons.Pencil className="size-4" />
                              </button>
                              <button
                                type="button"
                                title={item.pinned ? 'Unpin session' : 'Pin session'}
                                aria-label={item.pinned ? 'Unpin session' : 'Pin session'}
                                onClick={() => toggleSessionPinned(item.id)}
                                className={actionButtonClass}
                              >
                                {item.pinned ? (
                                  <icons.PinOff className="size-4" />
                                ) : (
                                  <icons.Pin className="size-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                title="Delete session"
                                aria-label="Delete session"
                                onClick={() => setDeleteSessionTargetId(item.id)}
                                className={actionButtonClass}
                              >
                                <icons.Trash2 className="size-4" />
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="flex h-full min-h-0 flex-col">
            <div className="px-1 pb-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Runtime Config
              </h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <RuntimeControls
                eventCount={eventCount}
                isStreaming={conversation.isStreaming}
                mockType={mockType}
                setMockType={setMockType}
                mockTimeoutSeconds={mockTimeoutSeconds}
                setMockTimeoutSeconds={setMockTimeoutSeconds}
                chunkDelayMs={chunkDelayMs}
                setChunkDelayMs={setChunkDelayMs}
                chunkSize={chunkSize}
                setChunkSize={setChunkSize}
              />
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-border/70 pt-3">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className={actionButtonClass}
            title={sidePanelMode === 'sessions' ? 'Switch to runtime config' : 'Switch to session list'}
            onClick={() => setSidePanelMode((current) => (current === 'sessions' ? 'config' : 'sessions'))}
          >
            <icons.Settings2 className="size-4" />
          </button>
          <button
            type="button"
            className={actionButtonClass}
            title="Create new session"
            onClick={createFreshSession}
          >
            <icons.HousePlus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main className={shellClass}>
      <div className={cn('flex min-h-0 flex-1 gap-4 overflow-hidden', workspaceHeightClass)}>
        {historyOpen ? (
          <aside className={`${panelClass} hidden w-[320px] shrink-0 overflow-hidden md:flex`}>
            <div className="flex h-full min-h-0 w-full min-w-0 flex-1 px-4 py-4">
              {historyPanel}
            </div>
          </aside>
        ) : null}

        <section className={`${panelClass} min-h-0 min-w-0 flex-1 overflow-hidden`}>
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-border px-4 py-3 md:px-5">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
                <div className="flex items-center justify-start">
                  <button
                    type="button"
                    onClick={() => setHistoryOpen((current) => !current)}
                    className={`${actionButtonClass} hidden md:inline-flex`}
                    title={historyOpen ? 'Collapse left panel' : 'Expand left panel'}
                  >
                    <icons.PanelLeft className="size-4" />
                  </button>
                </div>

                <div className="flex min-w-0 items-center justify-center gap-2 text-center">
                  <h2 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    Conversation
                  </h2>
                  <InfoTooltip
                    content="The message list owns the vertical scroll area. Older metadata rows keep their height and only reveal actions on hover."
                    align="end"
                    desktopSide="bottom"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <div className="size-7" aria-hidden="true" />
                </div>
              </div>
            </div>

            <AIMessageList
              messages={conversation.messages}
              className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5"
              contentClassName="mx-0 max-w-none gap-3"
              emptyState={(
                <div className="mx-auto flex w-full max-w-3xl flex-col items-start justify-center gap-4 rounded-3xl border border-dashed border-border px-5 py-8 text-left">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Start a conversation</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Use the mock scenarios to validate layout, markdown rendering, and structured
                      card parts.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {samplePrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setInput(prompt)}
                        className="rounded-full border border-border px-3 py-2 text-left text-xs text-foreground transition hover:bg-muted"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              renderMessage={(message) => {
                const text = getMessageText(message) || message.errorMessage || '';
                const isUser = message.role === 'user';
                const isActive = message.id === activeMessageId;

                return (
                  <div className={cn('group flex w-full', isUser ? 'justify-end' : 'justify-start')}>
                    <div className="w-full max-w-[92%] sm:max-w-[82%]">
                      <AIMessageBubble
                        message={message}
                        maxWidthClassName="max-w-full"
                        showFooter={false}
                        cardClassName="rounded-[26px]"
                      />

                      <div
                        className={cn(
                          'relative mt-1 flex h-7 items-center justify-between gap-2 px-2 text-[10px] leading-none text-muted-foreground transition-all duration-150',
                          isActive
                            ? 'translate-y-0 opacity-100'
                            : 'translate-y-0 opacity-0 group-hover:opacity-100',
                        )}
                      >
                        <div className={cn('flex min-w-0 flex-1 items-center gap-1.5', isUser && 'justify-end')}>
                          <button
                            type="button"
                            title="Copy message"
                            aria-label="Copy message"
                            onClick={() => copyMessage(message.id, text)}
                            className={actionButtonClass}
                          >
                            {copiedMessageId === message.id ? (
                              <icons.CopyCheck className="size-4" />
                            ) : (
                              <icons.Copy className="size-4" />
                            )}
                          </button>

                          {isUser ? (
                            <button
                              type="button"
                              title="Reuse in composer"
                              aria-label="Reuse in composer"
                              onClick={() => reuseMessage(text)}
                              className={actionButtonClass}
                            >
                              <icons.RefreshCcw className="size-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Retry from previous user message"
                              aria-label="Retry from previous user message"
                              onClick={() => retryFromMessage(message)}
                              className={actionButtonClass}
                            >
                              <icons.RotateCcw className="size-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            title="Delete message"
                            aria-label="Delete message"
                            onClick={() => setDeleteTargetId(message.id)}
                            className={actionButtonClass}
                          >
                            <icons.Trash2 className="size-4" />
                          </button>

                          {!isUser ? (
                            <>
                              <AIMessageMeta
                                message={message}
                                showTime={false}
                                showStatus={false}
                                showRuntime
                                showFailureReason
                                className="min-w-0 shrink-0 gap-x-1.5 gap-y-0.5 text-[10px] leading-none"
                              />
                              <AIStatusIndicator message={message} className="shrink-0" />
                            </>
                          ) : null}
                        </div>

                        {isUser ? (
                          <AIMessageMeta
                            message={message}
                            showTime={false}
                            showRuntime={false}
                            showFailureReason={false}
                            className="min-w-0 shrink-0 gap-x-1.5 gap-y-0.5 text-[10px] leading-none"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <div className="border-t border-border px-3 py-3 md:px-5 md:py-4">
              <AIChatComposer
                value={input}
                onChange={setInput}
                onSubmit={submit}
                onStop={conversation.stopGeneration}
                isStreaming={conversation.isStreaming}
                placeholder="Ask the ddaaS AI runtime something..."
                textareaRef={textareaRef}
                minHeight={52}
                maxHeight={180}
                leftSlot={(
                  <button
                    type="button"
                    onClick={() => setMobileHistoryOpen(true)}
                    className={`${subtleButtonClass} md:hidden`}
                  >
                    Session
                  </button>
                )}
                submitControl={(
                  <button
                    type="button"
                    title="Send message"
                    aria-label="Send message"
                    onClick={submit}
                    disabled={effectiveInput.length === 0}
                    className="inline-flex size-9 items-center justify-center rounded-full bg-foreground text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <icons.ArrowUp className="size-4" />
                  </button>
                )}
                stopControl={(
                  <button
                    type="button"
                    title="Stop generation"
                    aria-label="Stop generation"
                    onClick={conversation.stopGeneration}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-muted"
                  >
                    <icons.CircleStop className="size-4 animate-spin [animation-duration:1.6s]" />
                  </button>
                )}
              />
            </div>
          </div>
        </section>
      </div>

      {mobileHistoryOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close session panel"
            onClick={() => setMobileHistoryOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-hidden rounded-t-[28px] border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {sidePanelMode === 'sessions' ? 'Recent sessions' : 'Runtime Config'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileHistoryOpen(false)}
                className={subtleButtonClass}
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(75dvh-73px)] overflow-y-auto px-4 py-4">
              {historyPanel}
            </div>
          </div>
        </div>
      ) : null}

      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-neutral-950 dark:ring-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This only removes the message from the current playground conversation state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMessage} className="rounded-full">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteSessionTargetId)}
        onOpenChange={(open) => !open && setDeleteSessionTargetId(null)}
      >
        <AlertDialogContent className="max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-neutral-950 dark:ring-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the session from the local playground history list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSession} className="rounded-full">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
