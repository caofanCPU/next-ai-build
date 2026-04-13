export const AI_MESSAGE_STATUSES = [
  'streaming',
  'completed',
  'stopped',
  'timeout',
  'request_aborted',
  'failed',
] as const;

export type AIMessageStatus = (typeof AI_MESSAGE_STATUSES)[number];

export const AI_MESSAGE_FAILURE_REASONS = [
  'invalid_request',
  'auth_error',
  'insufficient_credits',
  'model_access_denied',
  'content_blocked',
  'rate_limited',
  'provider_error',
  'no_provider_available',
  'empty_response',
  'stream_error',
  'unknown',
] as const;

export type AIMessageFailureReason = (typeof AI_MESSAGE_FAILURE_REASONS)[number];

export type AIErrorPayload = {
  error: string;
  status: AIMessageStatus;
  failureReason?: AIMessageFailureReason;
  upstreamStatusCode?: number;
};

export function isAIMessageStatus(value: unknown): value is AIMessageStatus {
  return typeof value === 'string' && AI_MESSAGE_STATUSES.includes(value as AIMessageStatus);
}

export function isAIMessageFailureReason(value: unknown): value is AIMessageFailureReason {
  return (
    typeof value === 'string' &&
    AI_MESSAGE_FAILURE_REASONS.includes(value as AIMessageFailureReason)
  );
}

export function mapHttpStatusToMessageStatus(statusCode: number): AIMessageStatus {
  if (statusCode === 408) {
    return 'timeout';
  }

  if (statusCode === 499) {
    return 'request_aborted';
  }

  if (statusCode >= 200 && statusCode < 300) {
    return 'completed';
  }

  return 'failed';
}

export function mapHttpStatusToFailureReason(
  statusCode: number,
  message?: string,
): AIMessageFailureReason {
  const normalizedMessage = message?.toLowerCase() ?? '';

  switch (statusCode) {
    case 400:
      return 'invalid_request';
    case 401:
      return 'auth_error';
    case 402:
      return 'insufficient_credits';
    case 403:
      return normalizedMessage.includes('moderat')
        ? 'content_blocked'
        : 'model_access_denied';
    case 429:
      return 'rate_limited';
    case 502:
      return 'provider_error';
    case 503:
      return 'no_provider_available';
    default:
      return 'unknown';
  }
}

export function createAIErrorPayload(params: {
  message: string;
  upstreamStatusCode: number;
  failureReason?: AIMessageFailureReason;
}): AIErrorPayload {
  const failureReason =
    params.failureReason ??
    mapHttpStatusToFailureReason(params.upstreamStatusCode, params.message);

  return {
    error: params.message,
    status: mapHttpStatusToMessageStatus(params.upstreamStatusCode),
    failureReason,
    upstreamStatusCode: params.upstreamStatusCode,
  };
}
