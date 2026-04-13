import type { MessagePart } from './message';
import type { AIErrorPayload } from './status';

export type AIStreamEvent =
  | {
      type: 'message_started';
      messageId: string;
      createdAt: number;
    }
  | {
      type: 'text_delta';
      messageId: string;
      text: string;
    }
  | {
      type: 'part';
      messageId: string;
      part: MessagePart;
    }
  | {
      type: 'message_completed';
      messageId: string;
      createdAt?: number;
      usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      };
    }
  | {
      type: 'error';
      error: AIErrorPayload;
    };
