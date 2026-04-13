import {
  getMessageText,
  type AIRuntimeRequest,
} from '@windrun-huaiin/contracts/ai';
import type { OpenRouterRequestBody } from './types';

export function buildModelMessages(
  messages: AIRuntimeRequest['messages'],
): OpenRouterRequestBody['messages'] {
  return messages
    .filter((message) => message.status !== 'failed')
    .map((message) => ({
      role: message.role,
      content: getMessageText(message),
    }))
    .filter((message) => message.content.trim().length > 0);
}
