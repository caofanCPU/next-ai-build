import type {
  AIErrorPayload,
  AIMessageStatus,
  AIRuntimeRequest,
  AIStreamEvent,
  ConversationMessage,
} from '@windrun-huaiin/contracts/ai';

export type AIRuntimeContext = {
  request: Request;
  input: AIRuntimeRequest;
  sessionId: string;
  requestId: string;
  startedAt: number;
  metadata?: Record<string, unknown>;
};

export type AIRuntimeUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type AIRuntimeResult = {
  status: AIMessageStatus;
  message?: ConversationMessage;
  usage?: AIRuntimeUsage;
  upstreamStatusCode?: number;
};

export type AIBeforeCallHook = (context: AIRuntimeContext) => Promise<void> | void;

export type AIAfterCallHook = (
  context: AIRuntimeContext,
  result: AIRuntimeResult,
) => Promise<void> | void;

export type AIErrorHook = (
  context: AIRuntimeContext,
  error: AIErrorPayload,
) => Promise<void> | void;

export type AIStorageAdapter = {
  loadHistory?(input: { sessionId: string; userId?: string }): Promise<ConversationMessage[]>;
  saveMessages?(input: {
    sessionId: string;
    userId?: string;
    messages: ConversationMessage[];
  }): Promise<void>;
};

export type AIBillingAdapter = {
  reserve?(context: AIRuntimeContext): Promise<void>;
  settle?(context: AIRuntimeContext, result: AIRuntimeResult): Promise<void>;
};

export type AILockAdapter = {
  withLock?<T>(key: string, fn: () => Promise<T>): Promise<T>;
};

export type AIMockHandler = (
  context: AIRuntimeContext,
) => Promise<Response | null> | Response | null;

export type AIRuntimeHooks = {
  beforeCall?: AIBeforeCallHook;
  afterCall?: AIAfterCallHook;
  onError?: AIErrorHook;
};

export type AIRuntimeAdapters = {
  storage?: AIStorageAdapter;
  billing?: AIBillingAdapter;
  lock?: AILockAdapter;
};

export type OpenRouterRequestBody = {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
  }>;
  stream: true;
  provider?: Record<string, unknown>;
  temperature?: number;
  max_tokens?: number;
};

export type OpenRouterClientConfig = {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  referer?: string;
  title?: string;
  timeoutMs?: number;
  provider?: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
  fetchImpl?: typeof fetch;
};

export type OpenRouterStreamResult = {
  response: Response;
  status: number;
};

export type AIRouteConfig = {
  openRouter?: Partial<OpenRouterClientConfig>;
  timeoutMs?: number;
  createSessionId?: () => string;
  mock?: AIMockHandler;
  hooks?: AIRuntimeHooks;
  adapters?: AIRuntimeAdapters;
  buildModelMessages?: (messages: AIRuntimeRequest['messages']) => OpenRouterRequestBody['messages'];
  streamToEvents?: (
    response: Response,
    context: AIRuntimeContext,
  ) => Promise<ReadableStream<Uint8Array>>;
};

export type GuardedStreamStartResult =
  | {
      ok: true;
      stream: ReadableStream<Uint8Array>;
    }
  | {
      ok: false;
      error: AIErrorPayload;
    };

export type EncodedAIStreamEvent = AIStreamEvent;
