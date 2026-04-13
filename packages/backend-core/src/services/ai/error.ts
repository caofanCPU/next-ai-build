import {
  createAIErrorPayload,
  type AIErrorPayload,
} from '@windrun-huaiin/contracts/ai';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getProviderErrorMessage(data: unknown) {
  if (!isObject(data)) {
    return null;
  }

  const error = data.error;
  if (isObject(error) && typeof error.message === 'string') {
    return error.message;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  return null;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function normalizeAIError(error: unknown): AIErrorPayload {
  if (isObject(error) && typeof error.status === 'number') {
    const message =
      getProviderErrorMessage(error) ??
      (typeof error.message === 'string' ? error.message : 'Error communicating with AI');

    return createAIErrorPayload({
      message,
      upstreamStatusCode: error.status,
    });
  }

  if (error instanceof Response) {
    return createAIErrorPayload({
      message: error.statusText || 'Error communicating with AI',
      upstreamStatusCode: error.status || 500,
    });
  }

  if (isAbortError(error)) {
    return {
      error: 'Request timed out',
      status: 'timeout',
      upstreamStatusCode: 408,
    };
  }

  return {
    error: error instanceof Error ? error.message : 'Error communicating with AI',
    status: 'failed',
    failureReason: 'unknown',
    upstreamStatusCode: 500,
  };
}
