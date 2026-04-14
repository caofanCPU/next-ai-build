'use client';

import {
  type AIErrorPayload,
  type AIRuntimeRequest,
  type AIStreamEvent,
  type ConversationMessage,
} from '@windrun-huaiin/contracts/ai';
import { startTransition, useRef, useState } from 'react';
import type {
  AIMessageRuntimeMetadata,
  AIConversationOptions,
  AIConversationState,
  SendMessageInput,
} from './types';

function createId(prefix: string) {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function getAssistantMessageText(message: ConversationMessage) {
  return message.parts
    .flatMap((part) => (part.type === 'text' ? [part.text] : []))
    .join('');
}

function createUserMessage(input: SendMessageInput): ConversationMessage {
  return {
    id: createId('user'),
    role: 'user',
    parts: [{ type: 'text', text: input.text }],
    createdAt: Date.now(),
    metadata: input.metadata,
  };
}

function getRuntimeMetadata(message: ConversationMessage): AIMessageRuntimeMetadata {
  const metadata = message.metadata?.aiRuntime;
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  return metadata as AIMessageRuntimeMetadata;
}

function withRuntimeMetadata(
  message: ConversationMessage,
  nextMetadata: AIMessageRuntimeMetadata,
): ConversationMessage {
  return {
    ...message,
    metadata: {
      ...(message.metadata ?? {}),
      aiRuntime: {
        ...getRuntimeMetadata(message),
        ...nextMetadata,
      },
    },
  };
}

function createAssistantPlaceholder(requestStartedAt: number): ConversationMessage {
  return {
    id: createId('assistant'),
    role: 'assistant',
    parts: [{ type: 'text', text: '' }],
    status: 'streaming',
    createdAt: Date.now(),
    metadata: {
      aiRuntime: {
        requestStartedAt,
      },
    },
  };
}

function defaultTransport(endpoint: string) {
  return async (input: AIRuntimeRequest, signal: AbortSignal) => {
    return fetch(endpoint, {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
  };
}

function updateAssistantText(
  messages: ConversationMessage[],
  messageId: string,
  textDelta: string,
): ConversationMessage[] {
  return messages.map((message): ConversationMessage => {
    if (message.id !== messageId) {
      return message;
    }

    const currentText = getAssistantMessageText(message);
    const runtimeMetadata = getRuntimeMetadata(message);
    const now = Date.now();

    return withRuntimeMetadata(
      {
        ...message,
        parts: [{ type: 'text', text: currentText + textDelta }],
        status: 'streaming',
      },
      runtimeMetadata.firstTokenAt
        ? {}
        : {
            firstTokenAt: now,
            firstTokenMs: runtimeMetadata.requestStartedAt
              ? now - runtimeMetadata.requestStartedAt
              : undefined,
          },
    );
  });
}

function updateMessageStarted(
  messages: ConversationMessage[],
  placeholderId: string,
  messageId: string,
): ConversationMessage[] {
  return messages.map((message): ConversationMessage => {
    if (message.id !== placeholderId) {
      return message;
    }

    return withRuntimeMetadata(
      {
        ...message,
        id: messageId,
      },
      {
        streamStartedAt: Date.now(),
      },
    );
  });
}

function updateMessageStatus(
  messages: ConversationMessage[],
  messageId: string,
  status: ConversationMessage['status'],
): ConversationMessage[] {
  return messages.map((message): ConversationMessage => {
    if (message.id !== messageId) {
      return message;
    }

    const now = Date.now();
    const runtimeMetadata = getRuntimeMetadata(message);

    return withRuntimeMetadata(
      {
        ...message,
        status,
      },
      {
        completedAt: now,
        totalMs: runtimeMetadata.requestStartedAt
          ? now - runtimeMetadata.requestStartedAt
          : undefined,
      },
    );
  });
}

function applyErrorToLatestAssistant(
  messages: ConversationMessage[],
  error: AIErrorPayload,
) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'assistant') {
      continue;
    }

    const nextMessages = [...messages];
    const now = Date.now();
    const runtimeMetadata = getRuntimeMetadata(message);
    nextMessages[index] = withRuntimeMetadata(
      {
        ...message,
        status: error.status,
        failureReason: error.failureReason,
        errorMessage: error.error,
        upstreamStatusCode: error.upstreamStatusCode,
      },
      {
        completedAt: now,
        totalMs: runtimeMetadata.requestStartedAt
          ? now - runtimeMetadata.requestStartedAt
          : undefined,
      },
    );
    return nextMessages;
  }

  return messages;
}

async function consumeEventStream(
  response: Response,
  onEvent: (event: AIStreamEvent) => void,
) {
  if (!response.body) {
    throw new Error('Missing response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }

    buffer += decoder.decode(chunk.value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const line = frame
        .split('\n')
        .find((item) => item.startsWith('data: '));

      if (!line) {
        continue;
      }

      onEvent(JSON.parse(line.slice(6)) as AIStreamEvent);
    }
  }
}

export function useAIConversation(options: AIConversationOptions) {
  const transport = options.transport ?? defaultTransport(options.endpoint);
  const [state, setState] = useState<AIConversationState>({
    sessionId: options.initialSessionId,
    messages: options.initialMessages ?? [],
    isStreaming: false,
  });
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = async (input: SendMessageInput) => {
    const text = input.text.trim();
    if (!text || state.isStreaming) {
      return;
    }

    const userMessage = createUserMessage(input);
    const requestStartedAt = Date.now();
    const assistantMessage = createAssistantPlaceholder(requestStartedAt);

    startTransition(() => {
      setState((current) => ({
        ...current,
        messages: [...current.messages, userMessage, assistantMessage],
        isStreaming: true,
        error: undefined,
      }));
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await transport(
        {
          sessionId: state.sessionId,
          messages: [...state.messages, userMessage],
          modelName: options.modelName,
          metadata: {
            ...(options.metadata ?? {}),
            ...(input.metadata ?? {}),
          },
        },
        controller.signal,
      );

      if (!response.ok) {
        const payload = (await response.json()) as AIErrorPayload;
        throw new Error(payload.error || 'AI request failed');
      }

      await consumeEventStream(response, (event) => {
        options.onEvent?.(event);

        startTransition(() => {
          setState((current) => {
            if (event.type === 'message_started') {
              return {
                ...current,
                messages: updateMessageStarted(current.messages, assistantMessage.id, event.messageId),
              };
            }

            if (event.type === 'text_delta') {
              return {
                ...current,
                messages: updateAssistantText(current.messages, event.messageId, event.text),
              };
            }

            if (event.type === 'part') {
              return {
                ...current,
                messages: current.messages.map((message): ConversationMessage => {
                  if (message.id !== event.messageId) {
                    return message;
                  }

                  return {
                    ...message,
                    parts: [...message.parts, event.part],
                  };
                }),
              };
            }

            if (event.type === 'message_completed') {
              return {
                ...current,
                isStreaming: false,
                messages: updateMessageStatus(current.messages, event.messageId, 'completed'),
              };
            }

            if (event.type === 'error') {
              return {
                ...current,
                isStreaming: false,
                error: event.error.error,
                messages: applyErrorToLatestAssistant(current.messages, event.error),
              };
            }

            return current;
          });
        });
      });

      startTransition(() => {
        setState((current) => ({
          ...current,
          isStreaming: false,
        }));
      });
    } catch (error) {
      const nextError = error instanceof Error ? error : new Error('AI request failed');
      options.onError?.(nextError);

      startTransition(() => {
        setState((current) => ({
          ...current,
          isStreaming: false,
          error: nextError.message,
          messages: applyErrorToLatestAssistant(current.messages, {
            error: nextError.message,
            status: controller.signal.aborted ? 'request_aborted' : 'failed',
            failureReason: 'unknown',
            upstreamStatusCode: controller.signal.aborted ? 499 : 500,
          }),
        }));
      });
    } finally {
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    abortRef.current?.abort();
  };

  const resetConversation = () => {
    startTransition(() => {
      setState({
        sessionId: options.initialSessionId,
        messages: options.initialMessages ?? [],
        isStreaming: false,
      });
    });
  };

  const removeMessage = (messageId: string) => {
    startTransition(() => {
      setState((current) => ({
        ...current,
        messages: current.messages.filter((message) => message.id !== messageId),
      }));
    });
  };

  const loadConversation = (messages: ConversationMessage[], sessionId?: string) => {
    startTransition(() => {
      setState({
        sessionId,
        messages,
        isStreaming: false,
      });
    });
  };

  return {
    ...state,
    sendMessage,
    stopGeneration,
    resetConversation,
    removeMessage,
    loadConversation,
  };
}
