import type {
  AIRuntimeRequest,
  AIStreamEvent,
  ConversationMessage,
  MessagePart,
} from '@windrun-huaiin/contracts/ai';
import type { ComponentType, ReactNode, RefObject } from 'react';

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
  leftSlot?: ReactNode;
  attachments?: ReactNode;
  helper?: ReactNode;
  submitLabel?: string;
  stopLabel?: string;
  minHeight?: number;
  maxHeight?: number;
  submitOnEnter?: boolean;
  shellClassName?: string;
  textareaClassName?: string;
  submitControl?: ReactNode;
  stopControl?: ReactNode;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  secondaryActions?: ReactNode;
  actionLayout?: 'inline' | 'stacked';
};

export type AIMessageBubbleProps = {
  message: ConversationMessage;
  className?: string;
  cardClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  maxWidthClassName?: string;
  showRoleLabel?: boolean;
  markdownComponents?: AIMarkdownComponentMap;
  showFooter?: boolean;
  renderContent?: (message: ConversationMessage) => ReactNode;
  renderMeta?: (message: ConversationMessage) => ReactNode;
  renderActions?: (message: ConversationMessage) => ReactNode;
};

export type AIMessageListProps = {
  messages: ConversationMessage[];
  className?: string;
  contentClassName?: string;
  emptyText?: string;
  emptyState?: ReactNode;
  autoScroll?: boolean;
  scrollBehavior?: ScrollBehavior;
  renderMessage?: (message: ConversationMessage) => ReactNode;
};

export type AIStatusIndicatorProps = {
  message: ConversationMessage;
  className?: string;
};

export type AIMessageContentProps = {
  message: ConversationMessage;
  className?: string;
  markdownComponents?: AIMarkdownComponentMap;
};

export type AIMessageMetaProps = {
  message: ConversationMessage;
  className?: string;
  showTime?: boolean;
  showStatus?: boolean;
  showRuntime?: boolean;
  showFailureReason?: boolean;
};

export type AIMessageActionsProps = {
  className?: string;
  children?: ReactNode;
};

export type AIMarkdownComponentMap = Record<string, ComponentType<any>>;

export type AIMarkdownProps = {
  content: string;
  className?: string;
  components?: AIMarkdownComponentMap;
};

export type TextMessagePart = Extract<MessagePart, { type: 'text' }>;

export type AIMessageRuntimeMetadata = {
  requestStartedAt?: number;
  streamStartedAt?: number;
  firstTokenAt?: number;
  firstTokenMs?: number;
  completedAt?: number;
  totalMs?: number;
};
