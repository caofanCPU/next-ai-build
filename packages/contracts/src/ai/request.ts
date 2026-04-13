import type { ConversationMessage } from './message';
import type { AIErrorPayload } from './status';

export type AIRuntimeRequest = {
  sessionId?: string;
  messages: ConversationMessage[];
  modelName?: string;
  metadata?: Record<string, unknown>;
};

export type AIRuntimeResponse =
  | {
      ok: true;
      sessionId: string;
    }
  | {
      ok: false;
      error: AIErrorPayload;
    };
