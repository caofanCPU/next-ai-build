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

export interface PublishMessageOptions {
  url: string;
  body: PublishBody;
}

/**
 * Publish a message. Returns message id or null if QStash is unavailable.
 */
export const publishMessage = async (options: PublishMessageOptions): Promise<string | null> => {
  return withQstash(async (client) => {
    const result = await (client as any).publishJSON({
      url: options.url,
      body: options.body,
    });
    return typeof result === 'string' ? result : result?.messageId ?? null;
  });
};

/**
 * Publish a delayed message. Returns message id or null if QStash is unavailable.
 */
export const publishDelayedMessage = async (
  options: PublishMessageOptions & { delaySec: number }
): Promise<string | null> => {
  return withQstash(async (client) => {
    const result = await (client as any).publishJSON({
      url: options.url,
      body: options.body,
      delay: options.delaySec,
    });
    return typeof result === 'string' ? result : result?.messageId ?? null;
  });
};

export interface ScheduleMessageOptions extends PublishMessageOptions {
  cron: string;
}

/**
 * Schedule a recurring message. Returns schedule id or null if QStash is unavailable.
 */
export const scheduleMessage = async (options: ScheduleMessageOptions): Promise<string | null> => {
  return withQstash(async (client) => {
    const anyClient = client as any;
    const result =
      (await anyClient.schedules?.create?.({
        url: options.url,
        body: options.body,
        cron: options.cron,
      })) ??
      (await anyClient.publishJSON?.({
        url: options.url,
        body: options.body,
        cron: options.cron,
      }));

    return typeof result === 'string' ? result : result?.scheduleId ?? result?.id ?? null;
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
