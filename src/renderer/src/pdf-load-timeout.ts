export const defaultPdfLoadTimeoutMs = 15_000;

export function waitForPdfLoad<T>(
  promise: PromiseLike<T>,
  {
    timeoutMs = defaultPdfLoadTimeoutMs,
    onTimeout,
  }: { timeoutMs?: number; onTimeout?: () => void } = {},
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeoutId = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      const error = new Error('PDF 页面准备超时，请重试渲染。');

      try {
        onTimeout?.();
      } finally {
        reject(error);
      }
    }, timeoutMs);

    void promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}
