export function createUpstreamAbortSignal(requestSignal: AbortSignal, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);

  const forwardAbort = () => {
    clearTimeout(timeoutId);
    controller.abort(requestSignal.reason ?? 'request_aborted');
  };

  if (requestSignal.aborted) {
    forwardAbort();
  } else {
    requestSignal.addEventListener('abort', forwardAbort, { once: true });
  }

  controller.signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timeoutId);
      requestSignal.removeEventListener('abort', forwardAbort);
    },
    { once: true },
  );

  return controller.signal;
}
