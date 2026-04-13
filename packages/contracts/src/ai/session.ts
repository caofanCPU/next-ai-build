import type { ConversationMessage } from './message';

export type ConversationSession = {
  id: string;
  userId?: string;
  mode?: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  metadata?: Record<string, unknown>;
};
