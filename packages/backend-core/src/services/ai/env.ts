import type { AIMockHandler, OpenRouterClientConfig } from './types';
import { createScenarioMockHandler } from './mock';

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value === '1' || value === 'true' || value === 'TRUE';
}

export type OpenRouterEnvConfig = {
  appName: string;
  timeoutMs: number;
  apiKey: string;
  modelName: string;
  enableMock: boolean;
  mockType: number;
  mockTimeoutSeconds: number;
  mockStreamChunkDelayMs: number;
  mockStreamChunkSize: number;
  contextWindowTurns: number;
  debug: boolean;
  baseUrl?: string;
  referer?: string;
};

export function getOpenRouterEnvConfig(): OpenRouterEnvConfig {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'DDaaS',
    timeoutMs: parseNumber(process.env.OPENROUTER_TIMEOUT_SECONDS, 240) * 1000,
    apiKey: process.env.OPENROUTER_API_KEY || '',
    modelName:
      process.env.NEXT_PUBLIC_OPENROUTER_MODEL_NAME || 'google/gemini-2.0-flash-001',
    enableMock: parseBoolean(process.env.OPENROUTER_ENABLE_MOCK, true),
    mockType: parseNumber(process.env.OPENROUTER_MOCK_TYPE, 0),
    mockTimeoutSeconds: parseNumber(process.env.OPENROUTER_MOCK_TIMEOUT_SECONDS, 3),
    mockStreamChunkDelayMs: parseNumber(process.env.OPENROUTER_MOCK_STREAM_CHUNK_DELAY_MS, 60),
    mockStreamChunkSize: parseNumber(process.env.OPENROUTER_MOCK_STREAM_CHUNK_SIZE, 8),
    contextWindowTurns: parseNumber(process.env.NEXT_PUBLIC_CHAT_CONTEXT_WINDOW_TURNS, 6),
    debug: parseBoolean(process.env.NEXT_PUBLIC_OPENROUTER_DEBUG, false),
    baseUrl: process.env.OPENROUTER_BASE_URL,
    referer: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  };
}

export function createOpenRouterClientConfigFromEnv(
  overrides?: Partial<OpenRouterClientConfig>,
): OpenRouterClientConfig {
  const envConfig = getOpenRouterEnvConfig();

  return {
    apiKey: overrides?.apiKey ?? envConfig.apiKey,
    baseUrl: overrides?.baseUrl ?? envConfig.baseUrl,
    defaultModel: overrides?.defaultModel ?? envConfig.modelName,
    referer: overrides?.referer ?? envConfig.referer,
    title: overrides?.title ?? envConfig.appName,
    timeoutMs: overrides?.timeoutMs ?? envConfig.timeoutMs,
    provider: overrides?.provider,
    temperature: overrides?.temperature,
    maxTokens: overrides?.maxTokens,
    fetchImpl: overrides?.fetchImpl,
  };
}

export function createOpenRouterMockFromEnv(): AIMockHandler | undefined {
  const envConfig = getOpenRouterEnvConfig();

  if (!envConfig.enableMock) {
    return undefined;
  }

  return createScenarioMockHandler({
    text:
      'This is a mock AI response from the shared backend-core runtime. Configure OPENROUTER_API_KEY and disable OPENROUTER_ENABLE_MOCK to use the real upstream model.',
    mockType: envConfig.mockType,
    mockTimeoutSeconds: envConfig.mockTimeoutSeconds,
    mockStreamChunkDelayMs: envConfig.mockStreamChunkDelayMs,
    mockStreamChunkSize: envConfig.mockStreamChunkSize,
  });
}
