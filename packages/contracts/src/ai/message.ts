import type { AIMessageFailureReason, AIMessageStatus } from './status';

export type MessagePart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image';
      url: string;
      mimeType?: string;
      alt?: string;
      source: 'internal' | 'external';
    }
  | {
      type: 'file';
      url: string;
      name?: string;
      mimeType?: string;
      source: 'internal' | 'external';
    };

export type ConversationMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ConversationMessage = {
  id: string;
  role: ConversationMessageRole;
  parts: MessagePart[];
  status?: AIMessageStatus;
  failureReason?: AIMessageFailureReason;
  errorMessage?: string;
  upstreamStatusCode?: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
};

export function getTextParts(parts: MessagePart[]): string[] {
  return parts.flatMap((part) => (part.type === 'text' ? [part.text] : []));
}

export function getMessageText(message: ConversationMessage): string {
  return getTextParts(message.parts).join('');
}
