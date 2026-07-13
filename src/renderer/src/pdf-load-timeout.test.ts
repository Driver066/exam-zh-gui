import { afterEach, describe, expect, it, vi } from 'vitest';

import { waitForPdfLoad } from './pdf-load-timeout';

describe('PDF load timeout', () => {
  afterEach(() => vi.useRealTimers());

  it('returns a PDF result that resolves before the timeout', async () => {
    await expect(waitForPdfLoad(Promise.resolve('ready'), { timeoutMs: 100 })).resolves.toBe(
      'ready',
    );
  });

  it('surfaces a retryable error and releases a stalled load', async () => {
    vi.useFakeTimers();
    const onTimeout = vi.fn();
    const result = waitForPdfLoad(new Promise<never>(() => undefined), {
      timeoutMs: 100,
      onTimeout,
    });
    const rejection = expect(result).rejects.toThrow('PDF 页面准备超时，请重试渲染。');

    await vi.advanceTimersByTimeAsync(100);

    await rejection;
    expect(onTimeout).toHaveBeenCalledOnce();
  });
});
