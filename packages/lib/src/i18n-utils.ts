export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMergeMessages(
  base: Record<string, unknown>,
  extra: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(extra)) {
    const current = result[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      result[key] = deepMergeMessages(current, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}
