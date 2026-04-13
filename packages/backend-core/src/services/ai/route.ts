import {
  AIRuntimeRequestSchema,
  createAIErrorPayload,
  type AIStreamEvent,
} from '@windrun-huaiin/contracts/ai';
import { createUpstreamAbortSignal } from './abort';
import { createOpenRouterClientConfigFromEnv, createOpenRouterMockFromEnv } from './env';
import { normalizeAIError } from './error';
import { buildModelMessages as defaultBuildModelMessages } from './message-builder';
import { callOpenRouterStream, guardedOpenRouterStreamStart } from './openrouter-client';
import type { AIRouteConfig, AIRuntimeContext } from './types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const streamingHeaders = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate, no-transform',
  Connection: 'keep-alive',
  Pragma: 'no-cache',
  'X-Accel-Buffering': 'no',
} as const;

function createRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function encodeEvent(event: AIStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function createEventStream(response: Response, messageId: string) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Missing upstream reader');
  }

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          encodeEvent({
            type: 'message_started',
            messageId,
            createdAt: Date.now(),
          }),
        ),
      );

      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) {
            break;
          }

          const text = decoder.decode(chunk.value, { stream: true });
          if (!text) {
            continue;
          }

          controller.enqueue(
            encoder.encode(
              encodeEvent({
                type: 'text_delta',
                messageId,
                text,
              }),
            ),
          );
        }

        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: 'message_completed',
              messageId,
              createdAt: Date.now(),
            }),
          ),
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeEvent({
              type: 'error',
              error: normalizeAIError(error),
            }),
          ),
        );
        controller.close();
      }
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });
}

export function createOpenRouterRoute(config: AIRouteConfig) {
  const openRouterConfig = createOpenRouterClientConfigFromEnv(config.openRouter);
  const mockHandler = config.mock ?? createOpenRouterMockFromEnv();

  return async function POST(request: Request) {
    const parsedBody = AIRuntimeRequestSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      const payload = createAIErrorPayload({
        message: 'Invalid AI runtime request body',
        upstreamStatusCode: 400,
        failureReason: 'invalid_request',
      });
      return Response.json(payload, { status: 400 });
    }

    const requestId = createRequestId();
    const sessionId = parsedBody.data.sessionId ?? (config.createSessionId?.() ?? createRequestId());
    const context: AIRuntimeContext = {
      request,
      input: parsedBody.data,
      sessionId,
      requestId,
      startedAt: Date.now(),
      metadata: parsedBody.data.metadata,
    };

    try {
      await config.adapters?.billing?.reserve?.(context);
      await config.hooks?.beforeCall?.(context);

      if (mockHandler) {
        const mockResponse = await mockHandler(context);
        if (mockResponse) {
          return mockResponse;
        }
      }

      const runUpstream = async () => {
        const upstreamSignal = createUpstreamAbortSignal(
          request.signal,
          config.timeoutMs ?? openRouterConfig.timeoutMs ?? 60_000,
        );

        const response = await callOpenRouterStream(
          openRouterConfig,
          {
            model: parsedBody.data.modelName ?? openRouterConfig.defaultModel,
            messages: (config.buildModelMessages ?? defaultBuildModelMessages)(parsedBody.data.messages),
            stream: true,
            provider: openRouterConfig.provider,
            temperature: openRouterConfig.temperature,
            max_tokens: openRouterConfig.maxTokens,
          },
          upstreamSignal,
        );

        return response.response;
      };

      const upstreamResponse = config.adapters?.lock?.withLock
        ? await config.adapters.lock.withLock(`ai:${sessionId}`, runUpstream)
        : await runUpstream();

      const guarded = await guardedOpenRouterStreamStart(upstreamResponse);
      if (!guarded.ok) {
        await config.hooks?.onError?.(context, guarded.error);
        await config.adapters?.billing?.settle?.(context, {
          status: guarded.error.status,
          upstreamStatusCode: guarded.error.upstreamStatusCode,
        });
        return Response.json(guarded.error, {
          status: guarded.error.upstreamStatusCode ?? 500,
        });
      }

      const messageId = `asst-${requestId}`;
      const wrappedResponse = new Response(
        config.streamToEvents
          ? await config.streamToEvents(
              new Response(guarded.stream, { headers: upstreamResponse.headers }),
              context,
            )
          : await createEventStream(
              new Response(guarded.stream, { headers: upstreamResponse.headers }),
              messageId,
            ),
        {
          headers: streamingHeaders,
        },
      );

      await config.hooks?.afterCall?.(context, {
        status: 'streaming',
        upstreamStatusCode: upstreamResponse.status,
      });

      return wrappedResponse;
    } catch (error) {
      const normalized = normalizeAIError(error);
      await config.hooks?.onError?.(context, normalized);
      await config.adapters?.billing?.settle?.(context, {
        status: normalized.status,
        upstreamStatusCode: normalized.upstreamStatusCode,
      });
      return Response.json(normalized, {
        status: normalized.upstreamStatusCode ?? 500,
      });
    }
  };
}
