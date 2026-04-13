import { normalizeAIError } from './error';
import type {
  OpenRouterClientConfig,
  OpenRouterRequestBody,
  OpenRouterStreamResult,
} from './types';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function callOpenRouterStream(
  config: OpenRouterClientConfig,
  body: OpenRouterRequestBody,
  signal: AbortSignal,
): Promise<OpenRouterStreamResult> {
  const fetchImpl = config.fetchImpl ?? fetch;
  const response = await fetchImpl(`${config.baseUrl ?? OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...(config.referer ? { 'HTTP-Referer': config.referer } : {}),
      ...(config.title ? { 'X-Title': config.title } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    let errorData: unknown = null;
    try {
      errorData = await response.clone().json();
    } catch {
      errorData = { message: response.statusText };
    }

    throw {
      status: response.status,
      message: response.statusText,
      ...((typeof errorData === 'object' && errorData !== null) ? errorData : {}),
    };
  }

  return {
    response,
    status: response.status,
  };
}

export async function guardedOpenRouterStreamStart(
  response: Response,
) {
  const reader = response.body?.getReader();
  if (!reader) {
    return {
      ok: false as const,
      error: normalizeAIError(new Error('Empty upstream response body')),
    };
  }

  const firstChunk = await reader.read();
  if (firstChunk.done || !firstChunk.value) {
    return {
      ok: false as const,
      error: {
        error: 'AI returned an empty response',
        status: 'failed' as const,
        failureReason: 'empty_response' as const,
        upstreamStatusCode: response.status,
      },
    };
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(firstChunk.value);
    },
    async pull(controller) {
      const nextChunk = await reader.read();
      if (nextChunk.done) {
        controller.close();
        return;
      }
      controller.enqueue(nextChunk.value);
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });

  return {
    ok: true as const,
    stream,
  };
}
