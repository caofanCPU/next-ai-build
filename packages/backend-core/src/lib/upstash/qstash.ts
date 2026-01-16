import { Receiver } from '@upstash/qstash';
import { getQstash } from '../upstash-config';

let cachedReceiver: Receiver | null = null;
let receiverInitAttempted = false;

const isTruthy = (value: string | undefined): boolean =>
  value === '1' || value === 'true' || value === 'TRUE';

const shouldSkipVerify = (): boolean =>
  process.env.NODE_ENV === 'development' && isTruthy(process.env.SKIP_UPSTASH_QSTASH_VERIFY);

const getReceiver = (): Receiver | null => {
  if (cachedReceiver) {
    return cachedReceiver;
  }
  if (receiverInitAttempted) {
    return null;
  }
  receiverInitAttempted = true;

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) {
    return null;
  }

  cachedReceiver = new Receiver({
    currentSigningKey,
    nextSigningKey,
  });
  return cachedReceiver;
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
  const client = getQstash();
  if (!client) {
    return null;
  }

  const result = await (client as any).publishJSON({
    url: options.url,
    body: options.body,
  });
  return typeof result === 'string' ? result : result?.messageId ?? null;
};

/**
 * Publish a delayed message. Returns message id or null if QStash is unavailable.
 */
export const publishDelayedMessage = async (
  options: PublishMessageOptions & { delaySec: number }
): Promise<string | null> => {
  const client = getQstash();
  if (!client) {
    return null;
  }

  const result = await (client as any).publishJSON({
    url: options.url,
    body: options.body,
    delay: options.delaySec,
  });
  return typeof result === 'string' ? result : result?.messageId ?? null;
};

export interface ScheduleMessageOptions extends PublishMessageOptions {
  cron: string;
}

/**
 * Schedule a recurring message. Returns schedule id or null if QStash is unavailable.
 */
export const scheduleMessage = async (options: ScheduleMessageOptions): Promise<string | null> => {
  const client = getQstash();
  if (!client) {
    return null;
  }

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
};

/**
 * Cancel a scheduled message. Returns false if QStash is unavailable.
 */
export const cancelSchedule = async (scheduleId: string): Promise<boolean> => {
  const client = getQstash();
  if (!client) {
    return false;
  }

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
