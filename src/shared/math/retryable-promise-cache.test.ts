import { describe, expect, it, vi } from 'vitest';

import { createRetryablePromiseCache } from './retryable-promise-cache';

describe('retryable promise cache', () => {
  it('deduplicates pending work and evicts rejected promises', async () => {
    const cache = createRetryablePromiseCache<string, string>();
    const factory = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('ready');

    await expect(cache.get('math', factory)).rejects.toThrow('temporary');
    await expect(cache.get('math', factory)).resolves.toBe('ready');
    await expect(cache.get('math', factory)).resolves.toBe('ready');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('allows callers to explicitly retry a cached success', async () => {
    const cache = createRetryablePromiseCache<string, number>();
    const factory = vi
      .fn<() => Promise<number>>()
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);

    await expect(cache.get('value', factory)).resolves.toBe(1);
    cache.delete('value');
    await expect(cache.get('value', factory)).resolves.toBe(2);
  });
});
