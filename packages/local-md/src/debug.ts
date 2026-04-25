const localMdRuntimeInstanceId = [
  process.pid,
  Date.now().toString(36),
  Math.random().toString(36).slice(2, 8),
].join(':');

export function isLocalMdDebugEnabled() {
  return process.env.LOCAL_MD_DEBUG?.toLowerCase() === 'true';
}

export function withLocalMdRuntimeDetails(details?: Record<string, unknown>) {
  return {
    runtimeInstanceId: localMdRuntimeInstanceId,
    ...(details ?? {}),
  };
}

export function logLocalMdDebug(message: string, details?: Record<string, unknown>) {
  if (!isLocalMdDebugEnabled()) return;

  const payload = withLocalMdRuntimeDetails(details);
  console.log(`[local-md] ${message}`, payload);
}

export function logLocalMdWarn(message: string, details?: Record<string, unknown>) {
  console.warn(`[local-md] ${message}`, withLocalMdRuntimeDetails(details));
}
