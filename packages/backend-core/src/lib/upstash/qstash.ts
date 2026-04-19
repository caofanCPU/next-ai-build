import { Receiver } from '@upstash/qstash';
import { withQstash } from '../upstash-config';

let cachedReceiver: Receiver | null = null;
let receiverWarnedMissingEnv = false;
let receiverWarnedInitError = false;

const isNonEmpty = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isTruthy = (value: string | undefined): boolean =>
  value === '1' || value === 'true' || value === 'TRUE';

const shouldSkipVerify = (): boolean =>
  process.env.NODE_ENV === 'development' && isTruthy(process.env.SKIP_UPSTASH_QSTASH_VERIFY);

const getRequiredAppName = (): string => {
  const appName = process.env.NEXT_PUBLIC_APP_NAME;
  if (!isNonEmpty(appName)) {
    throw new Error(
      '[Upstash QStash] NEXT_PUBLIC_APP_NAME is required for QStash naming and must not be empty'
    );
  }

  const normalized = appName.replace(/\s+/g, '').toLowerCase();
  if (!normalized) {
    throw new Error(
      '[Upstash QStash] NEXT_PUBLIC_APP_NAME must contain non-whitespace characters for QStash naming'
    );
  }

  return normalized;
};

const getQstashNamePrefix = (): string => {
  const envSuffix = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  return `${getRequiredAppName()}_${envSuffix}`;
};

const prefixQstashName = (resourceType: 'queue', name: string): string => {
  if (!isNonEmpty(name)) {
    throw new Error(`[Upstash QStash] ${resourceType} name must not be empty`);
  }

  return `${getQstashNamePrefix()}_${resourceType}_${name}`;
};

const getReceiver = (): Receiver | null => {
  if (cachedReceiver) {
    return cachedReceiver;
  }

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    if (!receiverWarnedMissingEnv) {
      receiverWarnedMissingEnv = true;
      console.warn(
        '[Upstash Config] QStash Receiver disabled: missing QSTASH_CURRENT_SIGNING_KEY or QSTASH_NEXT_SIGNING_KEY'
      );
    }
    return null;
  }

  try {
    cachedReceiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });
    return cachedReceiver;
  } catch (error) {
    if (!receiverWarnedInitError) {
      receiverWarnedInitError = true;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[Upstash Config] QStash Receiver init failed: ${message}`);
    }
    return null;
  }
};

export type PublishBody = Record<string, unknown> | string | number | boolean | null;

export interface QstashEnvelope<TBody extends PublishBody = PublishBody> {
  source_msg_id: string;
  payload: TBody;
}

export interface PublishMessageOptions<TBody extends PublishBody = PublishBody> {
  url: string;
  body: TBody;
}

export interface PublishBroadcastMessageOptions<TBody extends PublishBody = PublishBody> {
  urlGroup: string;
  body: TBody;
}

export interface PublishFIFOQueueMessageOptions<TBody extends PublishBody = PublishBody> {
  queueName: string;
  url: string;
  body: TBody;
}

const generateSourceMessageId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
};

const createEnvelope = <TBody extends PublishBody>(body: TBody): QstashEnvelope<TBody> => {
  return {
    source_msg_id: generateSourceMessageId(),
    payload: body,
  };
};

/**
 * Publish a message. Returns message id or null if QStash is unavailable.
 */
export const publishMessage = async <TBody extends PublishBody>(
  options: PublishMessageOptions<TBody>
): Promise<{ messageId: string | null; message: QstashEnvelope<TBody> } | null> => {
  const message = createEnvelope(options.body);

  return withQstash(async (client) => {
    const result = await (client as any).publishJSON({
      url: options.url,
      body: message,
    });
    return {
      messageId: typeof result === 'string' ? result : result?.messageId ?? null,
      message,
    };
  });
};

/**
 * Publish a broadcast message to a QStash URL Group.
 * Returns message ids or null if QStash is unavailable.
 */
export const publishBroadcastMessage = async <TBody extends PublishBody>(
  options: PublishBroadcastMessageOptions<TBody>
): Promise<{ messageIds: string[]; message: QstashEnvelope<TBody> } | null> => {
  const message = createEnvelope(options.body);

  return withQstash(async (client) => {
    const result = await (client as any).publishJSON({
      urlGroup: options.urlGroup,
      body: message,
    });

    const messageIds = Array.isArray(result)
      ? result
          .map((item) =>
            typeof item === 'string' ? item : typeof item?.messageId === 'string' ? item.messageId : null
          )
          .filter((messageId): messageId is string => typeof messageId === 'string')
      : typeof result === 'string'
        ? [result]
        : typeof result?.messageId === 'string'
          ? [result.messageId]
          : [];

    return {
      messageIds,
      message,
    };
  });
};

/**
 * Publish a single-recipient message into a QStash FIFO queue.
 * Returns message id or null if QStash is unavailable.
 */
export const publishFIFOQueueMessage = async <TBody extends PublishBody>(
  options: PublishFIFOQueueMessageOptions<TBody>
): Promise<{ messageId: string | null; message: QstashEnvelope<TBody> } | null> => {
  const message = createEnvelope(options.body);
  const queueName = prefixQstashName('queue', options.queueName);

  return withQstash(async (client) => {
    const anyClient = client as any;
    const queueClient = anyClient.queue?.({ queueName });
    if (!queueClient?.enqueueJSON) {
      throw new Error('QStash queue enqueueJSON API is unavailable');
    }

    const result = await queueClient.enqueueJSON({
      url: options.url,
      body: message,
    });

    return {
      messageId: typeof result === 'string' ? result : result?.messageId ?? null,
      message,
    };
  });
};

/**
 * Publish a delayed message. Returns message id or null if QStash is unavailable.
 */
export const publishDelayedMessage = async <TBody extends PublishBody>(
  options: PublishMessageOptions<TBody> & { delaySec: number }
): Promise<{ messageId: string | null; message: QstashEnvelope<TBody> } | null> => {
  const message = createEnvelope(options.body);

  return withQstash(async (client) => {
    const result = await (client as any).publishJSON({
      url: options.url,
      body: message,
      delay: options.delaySec,
    });
    return {
      messageId: typeof result === 'string' ? result : result?.messageId ?? null,
      message,
    };
  });
};

export interface ScheduleMessageOptions<TBody extends PublishBody = PublishBody>
  extends PublishMessageOptions<TBody> {
  cron: string;
}

/**
 * Schedule a recurring message. Returns schedule id or null if QStash is unavailable.
 */
export const scheduleMessage = async <TBody extends PublishBody>(
  options: ScheduleMessageOptions<TBody>
): Promise<{ scheduleId: string | null; message: QstashEnvelope<TBody> } | null> => {
  const message = createEnvelope(options.body);

  return withQstash(async (client) => {
    const anyClient = client as any;
    const result =
      (await anyClient.schedules?.create?.({
        url: options.url,
        body: message,
        cron: options.cron,
      })) ??
      (await anyClient.publishJSON?.({
        url: options.url,
        body: message,
        cron: options.cron,
      }));

    return {
      scheduleId: typeof result === 'string' ? result : result?.scheduleId ?? result?.id ?? null,
      message,
    };
  });
};

/**
 * Cancel a scheduled message. Returns false if QStash is unavailable.
 */
export const cancelSchedule = async (scheduleId: string): Promise<boolean> => {
  const result = await withQstash(async (client) => {
    const anyClient = client as any;
    if (anyClient.schedules?.delete) {
      await anyClient.schedules.delete(scheduleId);
      return true;
    }
    if (anyClient.schedules?.remove) {
      await anyClient.schedules.remove(scheduleId);
      return true;
    }
    return false;
  });

  return result ?? false;
};

export interface VerifyQstashOptions {
  signature: string;
  body: string;
  url: string;
}

/**
 * Verify QStash signature. Throws on failure in non-dev environments.
 */
export const verifyQstashSignature = async (options: VerifyQstashOptions): Promise<boolean> => {
  if (shouldSkipVerify()) {
    return true;
  }

  const receiver = getReceiver();
  if (!receiver) {
    throw new Error('QStash signing keys are missing');
  }

  const verifier = (receiver as any).verify ?? (receiver as any).verifySignature;
  if (!verifier) {
    throw new Error('QStash receiver verify method is unavailable');
  }

  await verifier.call(receiver, {
    signature: options.signature,
    body: options.body,
    url: options.url,
  });
  return true;
};
