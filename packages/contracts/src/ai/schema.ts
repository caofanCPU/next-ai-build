import { z } from 'zod';
import {
  AI_MESSAGE_FAILURE_REASONS,
  AI_MESSAGE_STATUSES,
} from './status';

export const AIMessageStatusSchema = z.enum(AI_MESSAGE_STATUSES);

export const AIMessageFailureReasonSchema = z.enum(AI_MESSAGE_FAILURE_REASONS);

export const AIErrorPayloadSchema = z.object({
  error: z.string(),
  status: AIMessageStatusSchema,
  failureReason: AIMessageFailureReasonSchema.optional(),
  upstreamStatusCode: z.number().int().optional(),
});

export const MessagePartSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image'),
    url: z.string(),
    mimeType: z.string().optional(),
    alt: z.string().optional(),
    source: z.enum(['internal', 'external']),
  }),
  z.object({
    type: z.literal('file'),
    url: z.string(),
    name: z.string().optional(),
    mimeType: z.string().optional(),
    source: z.enum(['internal', 'external']),
  }),
]);

export const ConversationMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  parts: z.array(MessagePartSchema),
  status: AIMessageStatusSchema.optional(),
  failureReason: AIMessageFailureReasonSchema.optional(),
  errorMessage: z.string().optional(),
  upstreamStatusCode: z.number().int().optional(),
  createdAt: z.number(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ConversationSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  mode: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  messages: z.array(ConversationMessageSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AIRuntimeRequestSchema = z.object({
  sessionId: z.string().optional(),
  messages: z.array(ConversationMessageSchema),
  modelName: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const AIRuntimeResponseSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    sessionId: z.string(),
  }),
  z.object({
    ok: z.literal(false),
    error: AIErrorPayloadSchema,
  }),
]);

export const AIUsageSchema = z.object({
  inputTokens: z.number().int().optional(),
  outputTokens: z.number().int().optional(),
  totalTokens: z.number().int().optional(),
});

export const AIStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message_started'),
    messageId: z.string(),
    createdAt: z.number(),
  }),
  z.object({
    type: z.literal('text_delta'),
    messageId: z.string(),
    text: z.string(),
  }),
  z.object({
    type: z.literal('part'),
    messageId: z.string(),
    part: MessagePartSchema,
  }),
  z.object({
    type: z.literal('message_completed'),
    messageId: z.string(),
    createdAt: z.number().optional(),
    usage: AIUsageSchema.optional(),
  }),
  z.object({
    type: z.literal('error'),
    error: AIErrorPayloadSchema,
  }),
]);
