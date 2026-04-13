import {
  createAIErrorPayload,
  type AIStreamEvent,
} from '@windrun-huaiin/contracts/ai';
import type { AIMockHandler, AIRuntimeContext } from './types';

const streamingHeaders = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate, no-transform',
  Connection: 'keep-alive',
  Pragma: 'no-cache',
  'X-Accel-Buffering': 'no',
} as const;

function encodeEvent(event: AIStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function createStreamResponse(events: AIStreamEvent[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: streamingHeaders,
  });
}

export function createSimpleMockHandler(text: string): AIMockHandler {
  return (context: AIRuntimeContext) => {
    const messageId = `mock-${context.requestId}`;
    return createStreamResponse([
      {
        type: 'message_started',
        messageId,
        createdAt: Date.now(),
      },
      {
        type: 'text_delta',
        messageId,
        text,
      },
      {
        type: 'message_completed',
        messageId,
        createdAt: Date.now(),
      },
    ]);
  };
}

export function createErrorMockResponse(statusCode: number, message: string) {
  return Response.json(
    createAIErrorPayload({
      message,
      upstreamStatusCode: statusCode,
    }),
    { status: statusCode },
  );
}

type MockFailureType = 'timeout' | 'request_aborted' | 'stream_error';

type MockScenario = {
  initialDelayMs?: number;
  streamFailureType?: MockFailureType;
  streamFailureAfterChunks?: number;
  immediateErrorType?: MockFailureType;
};

export type ConfigurableMockOptions = {
  text: string;
  initialDelayMs?: number;
  chunkDelayMs?: number;
  chunkSize?: number;
  streamFailureType?: MockFailureType;
  streamFailureAfterChunks?: number;
};

export function getMockScenario(mockType: number, mockTimeoutMs: number): MockScenario {
  switch (mockType) {
    case 1:
      return {
        initialDelayMs: mockTimeoutMs,
      };
    case 2:
      return {
        immediateErrorType: 'timeout',
      };
    case 3:
      return {
        streamFailureType: 'timeout',
        streamFailureAfterChunks: 3,
      };
    case 4:
      return {
        streamFailureType: 'request_aborted',
        streamFailureAfterChunks: 3,
      };
    case 5:
      return {
        streamFailureType: 'stream_error',
        streamFailureAfterChunks: 3,
      };
    default:
      return {};
  }
}

async function sleep(delayInMs: number) {
  await new Promise((resolve) => setTimeout(resolve, delayInMs));
}

function createMockErrorPayload(failureType: MockFailureType) {
  if (failureType === 'timeout') {
    return createAIErrorPayload({
      message: 'Request timed out',
      upstreamStatusCode: 408,
    });
  }

  if (failureType === 'request_aborted') {
    return createAIErrorPayload({
      message: 'Request aborted',
      upstreamStatusCode: 499,
    });
  }

  return createAIErrorPayload({
    message: 'Error communicating with AI',
    upstreamStatusCode: 502,
    failureReason: 'stream_error',
  });
}

function createMockFailureResponse(failureType: MockFailureType) {
  const payload = createMockErrorPayload(failureType);
  return Response.json(payload, { status: payload.upstreamStatusCode ?? 500 });
}

function chunkTextByWords(text: string, chunkSize: number) {
  const wordChunks = text.match(/\S+\s*/g) ?? [text];
  const normalizedChunkSize = Math.max(1, chunkSize);
  const chunks: string[] = [];

  for (let index = 0; index < wordChunks.length; index += normalizedChunkSize) {
    chunks.push(wordChunks.slice(index, index + normalizedChunkSize).join(''));
  }

  return chunks;
}

export function createConfigurableMockHandler(options: ConfigurableMockOptions): AIMockHandler {
  return async (context: AIRuntimeContext) => {
    if ((options.initialDelayMs ?? 0) > 0) {
      await sleep(options.initialDelayMs!);
    }

    const messageId = `mock-${context.requestId}`;
    const chunks = chunkTextByWords(options.text, options.chunkSize ?? 4);
    const chunkDelayMs = Math.max(0, options.chunkDelayMs ?? 0);
    const failureAfterChunks = options.streamFailureAfterChunks ?? 0;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
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

        for (let index = 0; index < chunks.length; index += 1) {
          if (
            options.streamFailureType &&
            failureAfterChunks > 0 &&
            index >= failureAfterChunks
          ) {
            controller.enqueue(
              encoder.encode(
                encodeEvent({
                  type: 'error',
                  error: createMockErrorPayload(options.streamFailureType),
                }),
              ),
            );
            controller.close();
            return;
          }

          controller.enqueue(
            encoder.encode(
              encodeEvent({
                type: 'text_delta',
                messageId,
                text: chunks[index],
              }),
            ),
          );

          if (chunkDelayMs > 0) {
            await sleep(chunkDelayMs);
          }
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
      },
    });

    return new Response(stream, {
      headers: streamingHeaders,
    });
  };
}

export function createScenarioMockHandler(params: {
  text: string;
  mockType: number;
  mockTimeoutSeconds: number;
  mockStreamChunkDelayMs: number;
  mockStreamChunkSize: number;
}): AIMockHandler {
  const scenario = getMockScenario(params.mockType, params.mockTimeoutSeconds * 1000);

  if (scenario.immediateErrorType) {
    return async () => createMockFailureResponse(scenario.immediateErrorType!);
  }

  return createConfigurableMockHandler({
    text: params.text,
    initialDelayMs: scenario.initialDelayMs,
    chunkDelayMs: params.mockStreamChunkDelayMs,
    chunkSize: params.mockStreamChunkSize,
    streamFailureType: scenario.streamFailureType,
    streamFailureAfterChunks: scenario.streamFailureAfterChunks,
  });
}
