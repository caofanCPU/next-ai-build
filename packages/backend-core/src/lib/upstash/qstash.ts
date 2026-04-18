import { Receiver } from '@upstash/qstash';
import { withQstash } from '../upstash-config';

let cachedReceiver: Receiver | null = null;
let receiverWarnedMissingEnv = false;
let receiverWarnedInitError = false;

const isTruthy = (value: string | undefined): boolean =>
  value === '1' || value === 'true' || value === 'TRUE';

const shouldSkipVerify = (): boolean =>
  process.env.NODE_ENV === 'development' && isTruthy(process.env.SKIP_UPSTASH_QSTASH_VERIFY);

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
