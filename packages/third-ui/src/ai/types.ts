import type {
  AIRuntimeRequest,
  AIStreamEvent,
  ConversationMessage,
  MessagePart,
} from '@windrun-huaiin/contracts/ai';

export type AIConversationTransport = (
  input: AIRuntimeRequest,
  signal: AbortSignal,
) => Promise<Response>;

export type AIConversationState = {
  sessionId?: string;
  messages: ConversationMessage[];
  isStreaming: boolean;
  error?: string;
};

export type AIConversationOptions = {
  endpoint: string;
  initialSessionId?: string;
  initialMessages?: ConversationMessage[];
  modelName?: string;
  metadata?: Record<string, unknown>;
  transport?: AIConversationTransport;
  onEvent?: (event: AIStreamEvent) => void;
  onError?: (error: Error) => void;
};

export type SendMessageInput = {
  text: string;
  metadata?: Record<string, unknown>;
};

export type AIChatComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  className?: string;
};

export type AIMessageBubbleProps = {
  message: ConversationMessage;
  className?: string;
};

export type AIMessageListProps = {
  messages: ConversationMessage[];
  className?: string;
  emptyText?: string;
};

export type AIStatusIndicatorProps = {
  message: ConversationMessage;
  className?: string;
};

export type TextMessagePart = Extract<MessagePart, { type: 'text' }>;
